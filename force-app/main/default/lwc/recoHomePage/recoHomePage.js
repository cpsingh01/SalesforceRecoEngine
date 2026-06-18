import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getHomeStats   from '@salesforce/apex/RecommendationService.getHomeStats';
import getRecentRecs  from '@salesforce/apex/RecommendationService.getRecentRecs';

const THEMES = [
    { hero:'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)', colors:['#0ea5e9','#6366f1','#06b6d4','#8b5cf6'], grads:[['#bae6fd','#e0f2fe'],['#c7d2fe','#e0e7ff'],['#a5f3fc','#cffafe'],['#ddd6fe','#ede9fe']] },
    { hero:'linear-gradient(135deg,#f97316 0%,#ec4899 100%)', colors:['#f97316','#ec4899','#f59e0b','#ef4444'], grads:[['#fed7aa','#ffedd5'],['#fce7f3','#fdf2f8'],['#fef3c7','#fffbeb'],['#fee2e2','#fff1f2']] },
    { hero:'linear-gradient(135deg,#10b981 0%,#0d9488 100%)', colors:['#10b981','#059669','#34d399','#0d9488'], grads:[['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1'],['#bbf7d0','#dcfce7'],['#6ee7b7','#d1fae5']] },
    { hero:'linear-gradient(135deg,#8b5cf6 0%,#d946ef 100%)', colors:['#8b5cf6','#a855f7','#d946ef','#7c3aed'], grads:[['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff'],['#f5d0fe','#fdf4ff'],['#c4b5fd','#ede9fe']] }
];

export default class RecoHomePage extends NavigationMixin(LightningElement) {

    @track totalCustomers = '--';
    @track totalProducts  = '--';
    @track totalRecs      = '--';
    @track avgRating      = '--';
    @track recentRecs     = [];
    @track isLoading      = true;

    theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    @wire(getHomeStats)
    wiredStats({ data, error }) {
        if (data) {
            this.totalCustomers = data.totalCustomers;
            this.totalProducts  = data.totalProducts;
            this.totalRecs      = data.totalRecs;
            this.avgRating      = data.avgRating;
        } else if (error) { console.error('HomeStats wire:', error); }
    }

    @wire(getRecentRecs)
    wiredRecs({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.recentRecs = data.map((r, idx) => ({
                ...r,
                rank:         idx + 1,
                CustomerName: r.Customer__r?.Name || '--',
                ProductName:  r.Product__r?.Name  || '--',
                displayRating: parseFloat(r.Predicted_Rating__c || 0).toFixed(2),
                confidencePct: Math.round((parseFloat(r.Predicted_Rating__c || 0) / 5) * 100),
                rankStyle:    'padding:10px 14px;font-weight:800;color:' + this.theme.colors[idx % 4] + ';',
                ratingStyle:  'font-weight:800;color:' + this.theme.colors[idx % 4] + ';',
                confStyle:    'font-size:11px;font-weight:700;color:' + this.theme.colors[idx % 4],
                confBarStyle: 'width:' + Math.round((parseFloat(r.Predicted_Rating__c || 0) / 5) * 100) + '%;height:100%;border-radius:3px;background:' + this.theme.colors[idx % 4]
            }));
        } else if (error) { console.error('RecentRecs wire:', error); }
    }

    // ── Ring arc (84% accuracy) ───────────────────────────────────────────
    get accuracyArc() {
        const circ = 2 * Math.PI * 56;
        return (0.84 * circ).toFixed(1) + ' ' + circ.toFixed(1);
    }

    // ── Theme inline styles ───────────────────────────────────────────────
    get heroStyle()  { return 'background:' + this.theme.hero + ';border-radius:20px;padding:32px 28px;margin-bottom:12px;position:relative;overflow:hidden;'; }
    get pill0S()     { return 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.25);color:#fff;'; }
    get pill1S()     { return 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.18);color:rgba(255,255,255,0.95);'; }
    get pill2S()     { return 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);'; }
    get newBtnStyle(){ return '--sds-c-button-brand-color-background:' + this.theme.colors[0] + ';'; }
    get thS()        { return 'padding:10px 14px;font-size:10px;letter-spacing:0.07em;font-weight:700;border-bottom:2px solid #f0f0f0;color:' + this.theme.colors[0] + ';'; }

    // Stat cards
    get sc0() { return 'flex:1 1 180px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border:1px solid ' + this.theme.grads[0][0] + ';background:' + this.theme.grads[0][1] + ';border-top:3px solid ' + this.theme.colors[0] + ';'; }
    get sc1() { return 'flex:1 1 180px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border:1px solid ' + this.theme.grads[1][0] + ';background:' + this.theme.grads[1][1] + ';border-top:3px solid ' + this.theme.colors[1] + ';'; }
    get sc2() { return 'flex:1 1 180px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border:1px solid ' + this.theme.grads[2][0] + ';background:' + this.theme.grads[2][1] + ';border-top:3px solid ' + this.theme.colors[2] + ';'; }
    get sc3() { return 'flex:1 1 180px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;cursor:default;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border:1px solid ' + this.theme.grads[3][0] + ';background:' + this.theme.grads[3][1] + ';border-top:3px solid ' + this.theme.colors[3] + ';'; }
    get si0() { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[0][0] + ';'; }
    get si1() { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[1][0] + ';'; }
    get si2() { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[2][0] + ';'; }
    get si3() { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[3][0] + ';'; }
    get ic0() { return '--lwc-colorTextIconDefault:' + this.theme.colors[0] + ';'; }
    get ic1() { return '--lwc-colorTextIconDefault:' + this.theme.colors[1] + ';'; }
    get ic2() { return '--lwc-colorTextIconDefault:' + this.theme.colors[2] + ';'; }
    get ic3() { return '--lwc-colorTextIconDefault:' + this.theme.colors[3] + ';'; }
    get sn0() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[0] + ';'; }
    get sn1() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[1] + ';'; }
    get sn2() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[2] + ';'; }
    get sn3() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[3] + ';'; }

    // Flow steps
    get fStep0() { return 'display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;border:1px solid ' + this.theme.grads[0][0] + ';background:' + this.theme.grads[0][1] + ';margin-bottom:4px;'; }
    get fStep1() { return 'display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;border:1px solid ' + this.theme.grads[1][0] + ';background:' + this.theme.grads[1][1] + ';margin-bottom:4px;'; }
    get fStep2() { return 'display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;border:1px solid ' + this.theme.grads[2][0] + ';background:' + this.theme.grads[2][1] + ';margin-bottom:4px;'; }
    get fStep3() { return 'display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:12px;border:1px solid ' + this.theme.grads[3][0] + ';background:' + this.theme.grads[3][1] + ';'; }

    // Action items
    get ac0() { return 'display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;border:1px solid ' + this.theme.grads[0][0] + ';background:' + this.theme.grads[0][1] + ';transition:transform 0.15s;'; }
    get ac1() { return 'display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;border:1px solid ' + this.theme.grads[1][0] + ';background:' + this.theme.grads[1][1] + ';transition:transform 0.15s;'; }
    get ac2() { return 'display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;border:1px solid ' + this.theme.grads[2][0] + ';background:' + this.theme.grads[2][1] + ';transition:transform 0.15s;'; }

    // Model param rows
    get mp0() { return 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:' + this.theme.grads[0][1] + ';'; }
    get mp1() { return 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:' + this.theme.grads[1][1] + ';'; }
    get mp2() { return 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:' + this.theme.grads[2][1] + ';'; }
    get mp3() { return 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:' + this.theme.grads[3][1] + ';'; }

    // ── Navigation ────────────────────────────────────────────────────────
    navToCustomers()      { this[NavigationMixin.Navigate]({ type:'standard__objectPage', attributes:{ objectApiName:'Customer__c', actionName:'list' }, state:{ filterName:'All' } }); }
    navToProducts()       { this[NavigationMixin.Navigate]({ type:'standard__objectPage', attributes:{ objectApiName:'Product__c',  actionName:'list' }, state:{ filterName:'All' } }); }
    navToRecommendations(){ this[NavigationMixin.Navigate]({ type:'standard__objectPage', attributes:{ objectApiName:'Recommendation__c', actionName:'list' }, state:{ filterName:'All' } }); }

    handleOpenRec(event) {
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        this[NavigationMixin.Navigate]({ type:'standard__recordPage', attributes:{ recordId:id, objectApiName:'Recommendation__c', actionName:'view' } });
    }

    // ── 3D handlers ───────────────────────────────────────────────────────
    handleHeroEnter(event) {
        const shine = this.template.querySelector('.hero-shine');
        if (shine) { shine.style.animationPlayState = 'running'; }
    }
    handleHeroLeave(event) { event.currentTarget.style.transform = ''; }
    handleHeroMove(event) {
        const el = event.currentTarget;
        const r  = el.getBoundingClientRect();
        const rx = (((event.clientY - r.top)  / r.height) - 0.5) * -2;
        const ry = (((event.clientX - r.left) / r.width)  - 0.5) *  2;
        el.style.transform  = 'perspective(1200px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        el.style.transition = 'transform 0.1s ease';
    }
    handleStatEnter(event) { event.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.12)'; }
    handleStatLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
        el.style.boxShadow  = '';
        el.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
    }
    handleStatMove(event) {
        const el = event.currentTarget;
        const r  = el.getBoundingClientRect();
        const rx = (((event.clientY - r.top)  / r.height) - 0.5) * -8;
        const ry = (((event.clientX - r.left) / r.width)  - 0.5) *  8;
        el.style.transform  = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.02)';
        el.style.transition = 'transform 0.08s ease';
    }
    handleActionEnter(event) { event.currentTarget.style.transform = 'translateX(6px)'; }
    handleActionLeave(event) { event.currentTarget.style.transform = 'translateX(0)'; event.currentTarget.style.transition = 'transform 0.3s ease'; }
}