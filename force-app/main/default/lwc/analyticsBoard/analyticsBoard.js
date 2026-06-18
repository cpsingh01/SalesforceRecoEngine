import { LightningElement, wire, track } from 'lwc';
import getAnalyticsData from '@salesforce/apex/RecommendationService.getAnalyticsData';

const THEMES = [
    { hero:'linear-gradient(135deg,#0ea5e9,#6366f1)', colors:['#0ea5e9','#6366f1','#06b6d4','#8b5cf6','#0284c7','#4f46e5'], grads:[['#bae6fd','#e0f2fe'],['#c7d2fe','#e0e7ff'],['#a5f3fc','#cffafe'],['#ddd6fe','#ede9fe'],['#bfdbfe','#dbeafe'],['#e9d5ff','#f3e8ff']] },
    { hero:'linear-gradient(135deg,#f97316,#ec4899)', colors:['#f97316','#ec4899','#f59e0b','#ef4444','#fb923c','#f43f5e'], grads:[['#fed7aa','#ffedd5'],['#fce7f3','#fdf2f8'],['#fef3c7','#fffbeb'],['#fee2e2','#fff1f2'],['#fde8d0','#fff7ed'],['#fcd9e0','#fff0f3']] },
    { hero:'linear-gradient(135deg,#10b981,#0d9488)', colors:['#10b981','#059669','#34d399','#0d9488','#6ee7b7','#2dd4bf'], grads:[['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1'],['#bbf7d0','#dcfce7'],['#6ee7b7','#d1fae5'],['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1']] },
    { hero:'linear-gradient(135deg,#8b5cf6,#d946ef)', colors:['#8b5cf6','#a855f7','#d946ef','#7c3aed','#c084fc','#e879f9'], grads:[['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff'],['#f5d0fe','#fdf4ff'],['#c4b5fd','#ede9fe'],['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff']] }
];

// SVG pie path calculator
function pieSlicePath(cx, cy, r, startAngle, endAngle) {
    const s = (startAngle - 90) * Math.PI / 180;
    const e = (endAngle   - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
}

export default class AnalyticsBoard extends LightningElement {

    @track stats         = { totalCustomers:'--', totalProducts:'--', totalRecs:'--', avgRating:'--' };
    @track topProducts   = [];
    @track topCustomers  = [];
    @track ratingBands   = [];
    @track categoryData  = [];
    @track isLoading     = true;
    @track showTooltip   = false;
    @track tooltipText   = '';
    @track tooltipStyle  = '';

    theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    @wire(getAnalyticsData)
    wiredData({ data, error }) {
        this.isLoading = false;
        if (data) { this._processData(data); }
        else if (error) { console.error('Analytics wire:', error); }
    }

    _processData(data) {
        const t = this.theme;
        this.stats = {
            totalCustomers: data.totalCustomers,
            totalProducts:  data.totalProducts,
            totalRecs:      data.totalRecs,
            avgRating:      data.avgRating
        };

        // ── Top Products bar chart ────────────────────────────────────────
        const maxP = Math.max(...(data.topProducts || []).map(p => p.recCount), 1);
        this.topProducts = (data.topProducts || []).map((p, i) => ({
            name:      p.productName,
            shortName: p.productName.length > 14 ? p.productName.slice(0,13) + '…' : p.productName,
            count:     p.recCount,
            barStyle:  'width:' + Math.max(Math.round((p.recCount/maxP)*100),6) + '%;height:100%;border-radius:7px;background:linear-gradient(90deg,' + t.grads[i%6][0] + ',' + t.colors[i%6] + ');',
            glowStyle: 'position:absolute;top:0;right:0;width:20px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35));border-radius:0 7px 7px 0;',
            valStyle:  'font-size:12px;font-weight:800;min-width:32px;text-align:right;color:' + t.colors[i%6]
        }));

        // ── Top Customers bar chart ───────────────────────────────────────
        const maxC = Math.max(...(data.topCustomers || []).map(c => c.recCount), 1);
        this.topCustomers = (data.topCustomers || []).map((c, i) => {
            const initials = (c.customerName || '??').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
            return {
                name:        c.customerName,
                initials,
                count:       c.recCount,
                avatarStyle: 'width:28px;height:28px;min-width:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;background:' + t.colors[i%6] + ';',
                barStyle:    'width:' + Math.max(Math.round((c.recCount/maxC)*100),6) + '%;height:100%;border-radius:7px;background:linear-gradient(90deg,' + t.grads[i%6][0] + ',' + t.colors[i%6] + ');',
                valStyle:    'font-size:12px;font-weight:800;min-width:32px;text-align:right;color:' + t.colors[i%6]
            };
        });

        // ── Rating bands vertical bar chart ───────────────────────────────
        const bands = [
            { label:'4.5–5.0', min:4.5, max:5.01 },
            { label:'4.0–4.5', min:4.0, max:4.5  },
            { label:'3.5–4.0', min:3.5, max:4.0  },
            { label:'3.0–3.5', min:3.0, max:3.5  },
            { label:'<3.0',    min:0,   max:3.0  }
        ];
        const bandCounts = bands.map(b => ({
            ...b,
            count: (data.ratingBands || []).find(r => r.bandLabel === b.label)?.cnt || 0
        }));
        const maxB = Math.max(...bandCounts.map(b => b.count), 1);
        this.ratingBands = bandCounts.map((b, i) => ({
            ...b,
            pct:        Math.round((b.count / Math.max(this.stats.totalRecs, 1)) * 100),
            vbarStyle:  'width:100%;height:' + Math.max(Math.round((b.count/maxB)*100),4) + '%;background:linear-gradient(180deg,' + t.colors[i%6] + ',' + t.grads[i%6][0] + ');border-radius:6px 6px 0 0;transition:height 1s ease;',
            countStyle: 'font-size:12px;font-weight:800;line-height:1;color:' + t.colors[i%6],
            pctStyle:   'font-size:9px;font-weight:600;color:' + t.colors[i%6]
        }));

        // ── Category pie chart ────────────────────────────────────────────
        const cats = data.categoryData || [];
        const totalCat = Math.max(cats.reduce((s,c) => s + (c.cnt||0), 0), 1);
        let angle = 0;
        this.categoryData = cats.map((c, i) => {
            const pct   = (c.cnt / totalCat) * 100;
            const sweep = (c.cnt / totalCat) * 360;
            const path  = sweep > 359 ? pieSlicePath(100,100,85,0,359.9) : pieSlicePath(100,100,85,angle,angle+sweep);
            angle += sweep;
            return { id: 'cat'+i, label: c.catName, count: c.cnt, pct: Math.round(pct), color: t.colors[i%6], path,
                     dotStyle: 'width:10px;height:10px;border-radius:50%;flex-shrink:0;background:' + t.colors[i%6] + ';',
                     valStyle: 'font-size:12px;font-weight:800;min-width:32px;text-align:right;color:' + t.colors[i%6] };
        });
    }

    // ── Computed pie slices ───────────────────────────────────────────────
    get pieSlices() { return this.categoryData; }

    // ── Model params ──────────────────────────────────────────────────────
    get modelParams() {
        const t = this.theme;
        return [
            { key:'Algorithm',  val:'SVD',                  rowStyle:'background:' + t.grads[0][1] + ';border-radius:6px;margin-bottom:4px;padding:6px 8px;display:flex;justify-content:space-between;', valStyle:'font-size:12px;font-weight:800;color:' + t.colors[0] },
            { key:'Approach',   val:'Collaborative Filter', rowStyle:'background:' + t.grads[1][1] + ';border-radius:6px;margin-bottom:4px;padding:6px 8px;display:flex;justify-content:space-between;', valStyle:'font-size:12px;font-weight:800;color:' + t.colors[1] },
            { key:'Factors',    val:'50',                   rowStyle:'background:' + t.grads[2][1] + ';border-radius:6px;margin-bottom:4px;padding:6px 8px;display:flex;justify-content:space-between;', valStyle:'font-size:12px;font-weight:800;color:' + t.colors[2] },
            { key:'Epochs',     val:'20',                   rowStyle:'background:' + t.grads[3][1] + ';border-radius:6px;margin-bottom:4px;padding:6px 8px;display:flex;justify-content:space-between;', valStyle:'font-size:12px;font-weight:800;color:' + t.colors[3] },
            { key:'RMSE',       val:'0.84',                 rowStyle:'background:' + t.grads[4][1] + ';border-radius:6px;margin-bottom:4px;padding:6px 8px;display:flex;justify-content:space-between;', valStyle:'font-size:12px;font-weight:800;color:' + t.colors[4] },
            { key:'Language',   val:'Python',               rowStyle:'background:' + t.grads[5][1] + ';border-radius:6px;padding:6px 8px;display:flex;justify-content:space-between;',                   valStyle:'font-size:12px;font-weight:800;color:' + t.colors[5] }
        ];
    }

    // ── Donut arcs ────────────────────────────────────────────────────────
    _arc(pct) { const c = 2*Math.PI*44; return (pct/100*c).toFixed(1)+' '+c.toFixed(1); }
    get acc84arc() { return this._arc(84); }
    get rmseArc()  { return this._arc(84); }
    get cov80arc() { return this._arc(80); }

    // ── Theme colours ─────────────────────────────────────────────────────
    get themeC0()    { return this.theme.colors[0]; }
    get themeC1()    { return this.theme.colors[1]; }
    get themeC2()    { return this.theme.colors[2]; }
    get heroStyle()  { return 'background:' + this.theme.hero + ';border-radius:20px;padding:28px 24px;margin-bottom:4px;position:relative;overflow:hidden;'; }
    get hk0()        { return 'text-align:center;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,0.22);backdrop-filter:blur(8px);min-width:76px;'; }
    get hk1()        { return 'text-align:center;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,0.16);backdrop-filter:blur(8px);min-width:76px;'; }
    get hk2()        { return 'text-align:center;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);min-width:76px;'; }
    get hk3()        { return 'text-align:center;padding:12px 16px;border-radius:12px;background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);min-width:76px;'; }

    // Perf boxes
    get perf0Style() { return 'border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid ' + this.theme.grads[0][0] + ';background:' + this.theme.grads[0][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get perf1Style() { return 'border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid ' + this.theme.grads[1][0] + ';background:' + this.theme.grads[1][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get perf2Style() { return 'border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid ' + this.theme.grads[2][0] + ';background:' + this.theme.grads[2][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get perf3Style() { return 'border-radius:16px;padding:16px;border:1px solid ' + this.theme.grads[3][0] + ';background:' + this.theme.grads[3][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get dn0()        { return 'font-size:22px;font-weight:800;line-height:1;color:' + this.theme.colors[0]; }
    get dn1()        { return 'font-size:22px;font-weight:800;line-height:1;color:' + this.theme.colors[1]; }
    get dn2()        { return 'font-size:22px;font-weight:800;line-height:1;color:' + this.theme.colors[2]; }

    // ── Tooltip ───────────────────────────────────────────────────────────
    _showTip(event, text) {
        this.tooltipText  = text;
        this.showTooltip  = true;
        this.tooltipStyle = 'top:' + (event.clientY - 36) + 'px;left:' + (event.clientX + 10) + 'px;';
    }
    _hideTip() { this.showTooltip = false; }

    handleBarEnter(event) { event.currentTarget.style.transform = 'scale(1.01)'; }
    handleBarLeave(event) { event.currentTarget.style.transform = 'scale(1)'; this._hideTip(); }

    handlePieEnter(event) {
        event.target.style.opacity = '0.8';
        event.target.style.transform = 'scale(1.05)';
        this._showTip(event, event.target.dataset.label + ': ' + event.target.dataset.val + ' recs');
    }
    handlePieLeave(event) {
        event.target.style.opacity = '1';
        event.target.style.transform = 'scale(1)';
        this._hideTip();
    }

    handleVbarEnter(event) {
        event.currentTarget.style.transform = 'translateY(-4px)';
        this._showTip(event, event.currentTarget.dataset.label + ': ' + event.currentTarget.dataset.val);
    }
    handleVbarLeave(event) { event.currentTarget.style.transform = 'translateY(0)'; this._hideTip(); }

    handleStatEnter(event) { event.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }
    handleStatLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(600px) rotateX(0) rotateY(0)';
        el.style.boxShadow  = '';
        el.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
    }
    handleStatMove(event) {
        const el = event.currentTarget, r = el.getBoundingClientRect();
        const rx = (((event.clientY-r.top)/r.height)-0.5)*-7;
        const ry = (((event.clientX-r.left)/r.width)-0.5)*7;
        el.style.transform  = 'perspective(600px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
        el.style.transition = 'transform 0.08s ease';
    }

    handleHeroEnter(event) {
        const shine = this.template.querySelector('.hero-shine');
        if (shine) { shine.style.animationPlayState = 'running'; }
    }
    handleHeroLeave(event) { event.currentTarget.style.transform = ''; }
    handleHeroMove(event) {
        const el = event.currentTarget, r = el.getBoundingClientRect();
        const rx = (((event.clientY-r.top)/r.height)-0.5)*-2;
        const ry = (((event.clientX-r.left)/r.width)-0.5)*2;
        el.style.transform = 'perspective(1200px) rotateX('+rx+'deg) rotateY('+ry+'deg)';
        el.style.transition = 'transform 0.1s ease';
    }
}