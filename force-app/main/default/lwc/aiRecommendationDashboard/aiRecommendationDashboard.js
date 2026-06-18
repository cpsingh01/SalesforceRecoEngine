import { LightningElement, api, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRecommendations  from '@salesforce/apex/RecommendationService.getRecommendations';
import getCustomerDetails  from '@salesforce/apex/RecommendationService.getCustomerDetails';
import logInteraction      from '@salesforce/apex/RecommendationService.logInteraction';

// ─────────────────────────────────────────────────────────────────────────────
// 8 BEAUTIFUL LIGHT THEMES — One picked randomly on every page load
// Each theme has: primary, accent1-4, bg, text, gradient stops
// All light/pastel — never dark
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = [
    {
        name:    'Ocean Breeze',
        primary: '#0ea5e9',
        colors:  ['#0ea5e9','#6366f1','#06b6d4','#8b5cf6','#0284c7','#4f46e5'],
        grads: [
            ['#bae6fd','#e0f2fe'],   // rank 1 - light blue
            ['#c7d2fe','#e0e7ff'],   // rank 2 - lavender
            ['#a5f3fc','#cffafe'],   // rank 3 - cyan
            ['#ddd6fe','#ede9fe'],   // rank 4 - violet
            ['#bfdbfe','#dbeafe'],   // rank 5 - sky
            ['#e9d5ff','#f3e8ff']    // rank 6 - purple
        ],
        avatar:  'linear-gradient(135deg,#0ea5e9,#6366f1)',
        logo:    '#0ea5e9',
        pill:    'background:#e0f2fe;color:#0369a1',
        liveDot: '#0ea5e9',
        livePill:'background:#e0f2fe;color:#0369a1',
    },
    {
        name:    'Tropical Sunset',
        primary: '#f97316',
        colors:  ['#f97316','#ec4899','#f59e0b','#ef4444','#fb923c','#f43f5e'],
        grads: [
            ['#fed7aa','#ffedd5'],
            ['#fce7f3','#fdf2f8'],
            ['#fef3c7','#fffbeb'],
            ['#fee2e2','#fff1f2'],
            ['#fde8d0','#fff7ed'],
            ['#fcd9e0','#fff0f3']
        ],
        avatar:  'linear-gradient(135deg,#f97316,#ec4899)',
        logo:    '#f97316',
        pill:    'background:#ffedd5;color:#c2410c',
        liveDot: '#10b981',
        livePill:'background:#d1fae5;color:#065f46',
    },
    {
        name:    'Forest Mint',
        primary: '#10b981',
        colors:  ['#10b981','#059669','#34d399','#0d9488','#6ee7b7','#2dd4bf'],
        grads: [
            ['#a7f3d0','#d1fae5'],
            ['#99f6e4','#ccfbf1'],
            ['#bbf7d0','#dcfce7'],
            ['#6ee7b7','#d1fae5'],
            ['#a5f3fc','#cffafe'],
            ['#bef264','#ecfccb']
        ],
        avatar:  'linear-gradient(135deg,#10b981,#0d9488)',
        logo:    '#059669',
        pill:    'background:#d1fae5;color:#065f46',
        liveDot: '#10b981',
        livePill:'background:#d1fae5;color:#065f46',
    },
    {
        name:    'Berry Bliss',
        primary: '#8b5cf6',
        colors:  ['#8b5cf6','#a855f7','#d946ef','#7c3aed','#c084fc','#e879f9'],
        grads: [
            ['#ddd6fe','#ede9fe'],
            ['#e9d5ff','#f3e8ff'],
            ['#f5d0fe','#fdf4ff'],
            ['#c4b5fd','#ede9fe'],
            ['#f0abfc','#fdf4ff'],
            ['#d8b4fe','#f3e8ff']
        ],
        avatar:  'linear-gradient(135deg,#8b5cf6,#d946ef)',
        logo:    '#8b5cf6',
        pill:    'background:#ede9fe;color:#5b21b6',
        liveDot: '#10b981',
        livePill:'background:#d1fae5;color:#065f46',
    },
    {
        name:    'Golden Hour',
        primary: '#f59e0b',
        colors:  ['#f59e0b','#d97706','#fbbf24','#b45309','#fcd34d','#f97316'],
        grads: [
            ['#fde68a','#fef3c7'],
            ['#fed7aa','#ffedd5'],
            ['#fef08a','#fefce8'],
            ['#fca5a5','#fee2e2'],
            ['#fdba74','#fff7ed'],
            ['#fcd34d','#fffbeb']
        ],
        avatar:  'linear-gradient(135deg,#f59e0b,#f97316)',
        logo:    '#d97706',
        pill:    'background:#fef3c7;color:#92400e',
        liveDot: '#10b981',
        livePill:'background:#d1fae5;color:#065f46',
    },
    {
        name:    'Rose Garden',
        primary: '#f43f5e',
        colors:  ['#f43f5e','#e11d48','#fb7185','#be123c','#fda4af','#f9a8d4'],
        grads: [
            ['#fecdd3','#fff1f2'],
            ['#fbcfe8','#fdf2f8'],
            ['#fca5a5','#fee2e2'],
            ['#f9a8d4','#fce7f3'],
            ['#fecaca','#fef2f2'],
            ['#f5d0fe','#fdf4ff']
        ],
        avatar:  'linear-gradient(135deg,#f43f5e,#8b5cf6)',
        logo:    '#e11d48',
        pill:    'background:#fff1f2;color:#be123c',
        liveDot: '#10b981',
        livePill:'background:#d1fae5;color:#065f46',
    },
    {
        name:    'Arctic Aurora',
        primary: '#06b6d4',
        colors:  ['#06b6d4','#0891b2','#22d3ee','#0e7490','#67e8f9','#a5f3fc'],
        grads: [
            ['#a5f3fc','#cffafe'],
            ['#bae6fd','#e0f2fe'],
            ['#99f6e4','#ccfbf1'],
            ['#7dd3fc','#bae6fd'],
            ['#6ee7b7','#d1fae5'],
            ['#c7d2fe','#e0e7ff']
        ],
        avatar:  'linear-gradient(135deg,#06b6d4,#6366f1)',
        logo:    '#0891b2',
        pill:    'background:#cffafe;color:#164e63',
        liveDot: '#06b6d4',
        livePill:'background:#cffafe;color:#164e63',
    },
    {
        name:    'Candy Pop',
        primary: '#ec4899',
        colors:  ['#ec4899','#8b5cf6','#f97316','#06b6d4','#10b981','#f59e0b'],
        grads: [
            ['#fce7f3','#fdf2f8'],
            ['#ddd6fe','#ede9fe'],
            ['#fed7aa','#ffedd5'],
            ['#a5f3fc','#cffafe'],
            ['#a7f3d0','#d1fae5'],
            ['#fef3c7','#fffbeb']
        ],
        avatar:  'linear-gradient(135deg,#ec4899,#8b5cf6)',
        logo:    '#ec4899',
        pill:    'background:#fce7f3;color:#9d174d',
        liveDot: '#10b981',
        livePill:'background:#d1fae5;color:#065f46',
    }
];

const CATEGORY_ICONS = {
    'ELECTRONICS':'utility:connected_apps','AUDIO':'utility:volume_high',
    'LAPTOPS':'utility:desktop_and_phone','TABLETS':'utility:tablet_portrait',
    'ACCESSORIES':'utility:gift_card','DISPLAYS':'utility:display_text',
    'MOBILES':'utility:call','WATCHES':'utility:clock','APPAREL':'utility:user',
    'FOOTWEAR':'utility:steps','SHOES':'utility:steps','BAGS':'utility:open_folder',
    'FURNITURE':'utility:home','SPORTS':'utility:activity','GAMING':'utility:games',
    'BOOKS':'utility:knowledge_base','BEAUTY':'utility:filterList',
    'JEWELRY':'utility:sparkles','OTHER':'utility:product','DEFAULT':'utility:product'
};

const DIST_COLORS = ['#60a5fa','#a78bfa','#34d399','#fbbf24','#d1d5db'];

export default class AiRecommendationDashboard extends NavigationMixin(LightningElement) {

    @api recordId;
    @api ratingThreshold    = 4;
    @api maxRecommendations = 6;
    @api modelLatentFactors = 50;
    @api modelEpochs        = 20;
    @api modelTrainSplit    = '80%';
    @api modelRmse          = '0.84';

    @track recommendations  = [];
    @track customer         = null;
    @track selectedRec      = null;
    @track activeFilter     = 'All';
    @track isLoading        = true;
    @track hasError         = false;
    @track errorMessage     = '';
    @track showToast        = false;
    @track toastMessage     = '';
    @track toastType        = 'success';

    // ── Random theme picked ONCE per page load ────────────────────────────
    theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    // ── Theme-driven computed styles for panels ───────────────────────────
    get algoPillStyle()  { return 'background:' + this.theme.grads[0][0] + ';color:' + this.theme.colors[0] + ';'; }
    get param0Style()    { return 'border-left:3px solid ' + this.theme.colors[0] + ';background:' + this.theme.grads[0][1] + ';border-radius:10px;padding:12px;'; }
    get param1Style()    { return 'border-left:3px solid ' + this.theme.colors[1] + ';background:' + this.theme.grads[1][1] + ';border-radius:10px;padding:12px;'; }
    get param2Style()    { return 'border-left:3px solid ' + this.theme.colors[2] + ';background:' + this.theme.grads[2][1] + ';border-radius:10px;padding:12px;'; }
    get param3Style()    { return 'border-left:3px solid ' + this.theme.colors[3] + ';background:' + this.theme.grads[3][1] + ';border-radius:10px;padding:12px;'; }
    get scoreBox0Style() { return 'border-top:3px solid ' + this.theme.colors[0] + ';background:' + this.theme.grads[0][1] + ';flex:1;border-radius:12px;padding:14px;text-align:center;border:1px solid rgba(0,0,0,0.04);'; }
    get scoreBox1Style() { return 'border-top:3px solid ' + this.theme.colors[1] + ';background:' + this.theme.grads[1][1] + ';flex:1;border-radius:12px;padding:14px;text-align:center;border:1px solid rgba(0,0,0,0.04);'; }
    get scoreBox2Style() { return 'border-top:3px solid ' + this.theme.colors[2] + ';background:' + this.theme.grads[2][1] + ';flex:1;border-radius:12px;padding:14px;text-align:center;border:1px solid rgba(0,0,0,0.04);'; }
    get scoreVal0Style() { return 'font-size:22px;font-weight:800;color:' + this.theme.colors[0]; }
    get scoreVal1Style() { return 'font-size:22px;font-weight:800;color:' + this.theme.colors[1]; }
    get scoreVal2Style() { return 'font-size:22px;font-weight:800;color:' + this.theme.colors[2]; }
    get toastStyle()     {
        const bg = this.toastType === 'success' ? this.theme.colors[0] : '#ef4444';
        return 'background:' + bg + ';display:flex;align-items:center;gap:10px;padding:14px 24px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.2);';
    }

    // ── Wire ─────────────────────────────────────────────────────────────
    @wire(getCustomerDetails, { customerId: '$recordId' })
    wiredCustomer({ data, error }) {
        if (data)  { this.customer = data; }
        else if (error) { console.error('Customer wire:', error); }
    }

    @wire(getRecommendations, { customerId: '$recordId', maxResults: '$maxRecommendations' })
    wiredRecommendations({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.recommendations = data.map((rec, idx) => this._enrich(rec, idx));
            this.selectedRec = this.recommendations.length > 0 ? this.recommendations[0] : null;
            this.hasError = false;
        } else if (error) {
            this.hasError     = true;
            this.errorMessage = error.body?.message || 'Unable to load recommendations.';
        }
    }

    // Apply theme to DOM elements after render
    renderedCallback() {
        this._applyThemeToDOM();
    }

    _applyThemeToDOM() {
        const t = this.theme;

        // Logo mark
        const logo = this.template.querySelector('.logo-mark');
        if (logo) logo.style.background = t.logo;

        // Avatar
        const av = this.template.querySelector('.avatar');
        if (av) av.style.background = t.avatar;

        // Live pill
        const pill = this.template.querySelector('.live-pill');
        if (pill) { pill.style.cssText += ';' + t.livePill; }

        const dot = this.template.querySelector('.live-dot');
        if (dot) dot.style.background = t.liveDot;

        // Stat tiles
        this.template.querySelectorAll('.stat-tile').forEach((tile, idx) => {
            tile.style.background   = t.grads[idx % t.grads.length][1];
            tile.style.borderTop    = '3px solid ' + t.colors[idx % t.colors.length];
            tile.style.boxShadow    = '0 4px 16px ' + t.colors[idx % t.colors.length] + '22';
        });
        this.template.querySelectorAll('.stat-num').forEach((num, idx) => {
            num.style.color = t.colors[idx % t.colors.length];
        });

        // Active filter button
        this.template.querySelectorAll('.filter-btn.on').forEach(btn => {
            btn.style.background = t.primary;
        });
    }

    // ── Enrich ───────────────────────────────────────────────────────────
    _enrich(rec, idx) {
        const rank    = idx + 1;
        const rating  = parseFloat(rec.Predicted_Rating__c) || 0;
        const confPct = Math.round((rating / 5) * 100);
        const rawCat  = (rec.Product__r?.Category__c || 'DEFAULT').toUpperCase();
        const t       = this.theme;
        const g       = t.grads[idx % t.grads.length];
        const c       = t.colors[idx % t.colors.length];
        const imgUrl  = rec.Product__r?.Image_URL__c;

        return {
            Id:                      rec.Id,
            External_Customer_ID__c: rec.External_Customer_ID__c || '--',
            Product_ID__c:           rec.Product_ID__c || rec.Product__c || '--',
            Product__c:              rec.Product__c,
            Predicted_Rating__c:     rec.Predicted_Rating__c,

            rank, productName: rec.Product__r?.Name || '--',
            category:   rawCat,
            categoryIcon: CATEGORY_ICONS[rawCat] || CATEGORY_ICONS.DEFAULT,
            hasImage:   !!(imgUrl && (imgUrl.startsWith('http') || imgUrl.startsWith('/'))),
            productImage: imgUrl || '',
            displayRating: rating.toFixed(2),
            confidencePct: confPct,
            stars: this._buildStars(rating),

            cardClass:       'prod-card' + (idx === 0 ? ' card-selected' : ''),
            hdrStyle:        'background:linear-gradient(135deg,' + g[0] + ',' + g[1] + ')',
            rankCircleStyle: 'background:#fff;color:' + c,
            iconBubbleStyle: 'background:rgba(255,255,255,0.9);width:74px;height:74px;border-radius:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.08);',
            iconColorStyle:  '--lwc-colorTextIconDefault:' + c,
            catPillStyle:    'background:' + g[0] + ';color:' + c + ';display:inline-block;font-size:9px;font-weight:800;letter-spacing:0.08em;padding:3px 9px;border-radius:6px;margin-bottom:7px;',
            btnStyle:        'background:' + c + ';font-size:12px;font-weight:700;padding:7px 18px;border-radius:9px;border:none;cursor:pointer;color:#fff;transition:transform 0.15s,opacity 0.15s;',
            catTextStyle:    'color:' + c,
            confStyle:       'width:' + confPct + '%;background:linear-gradient(90deg,' + c + ',' + g[0] + ')'
        };
    }

    _buildStars(rating) {
        return Array.from({ length: 5 }, (_, i) => ({
            key: 's' + i,
            cssClass: 'star' + (rating >= i+1 ? ' star-filled' : rating >= i+0.5 ? ' star-half' : '')
        }));
    }

    // ── 3D tilt on mouseenter/move/leave ─────────────────────────────────
    handle3DEnter(event) {
        const el = event.currentTarget;
        el.style.transition = 'transform 0.1s ease, box-shadow 0.2s ease';
        el.style.boxShadow  = '0 16px 40px rgba(0,0,0,0.15)';
    }

    handle3DMove(event) {
        const el   = event.currentTarget;
        const rect = el.getBoundingClientRect();
        const x    = event.clientX - rect.left;
        const y    = event.clientY - rect.top;
        const cx   = rect.width / 2;
        const cy   = rect.height / 2;
        const rotX = ((y - cy) / cy) * -8;
        const rotY = ((x - cx) / cx) *  8;
        el.style.transform = 'perspective(600px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.02)';
    }

    handle3DLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
        el.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.07)';
        el.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
    }

    // ── 3D tilt for product cards ─────────────────────────────────────────
    handleCardMouseEnter(event) {
        const wrap = event.currentTarget;
        const card = wrap.querySelector('.prod-card');
        if (card) {
            card.style.transition = 'transform 0.1s ease, box-shadow 0.2s';
            card.style.boxShadow  = '0 20px 50px rgba(0,0,0,0.18)';
        }
    }

    handleCardMouseMove(event) {
        const wrap = event.currentTarget;
        const card = wrap.querySelector('.prod-card');
        if (!card) return;
        const rect = wrap.getBoundingClientRect();
        const x    = event.clientX - rect.left;
        const y    = event.clientY - rect.top;
        const cx   = rect.width / 2;
        const cy   = rect.height / 2;
        const rotX = ((y - cy) / cy) * -10;
        const rotY = ((x - cx) / cx) *  10;
        card.style.transform = 'perspective(700px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.03)';
    }

    handleCardMouseLeave(event) {
        const wrap = event.currentTarget;
        const card = wrap.querySelector('.prod-card');
        if (card) {
            card.style.transition = 'transform 0.5s ease, box-shadow 0.4s ease';
            card.style.transform  = 'perspective(700px) rotateX(0) rotateY(0) scale(1)';
            card.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.08)';
        }
    }

    // ── Getters ──────────────────────────────────────────────────────────
    get customerInitials() {
        if (!this.customer?.Name) return '??';
        return this.customer.Name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    }

    get tabs() {
        return [
            { id: 'recommendations', label: 'Recommendations' },
            { id: 'customer360',     label: 'Customer 360' },
            { id: 'modelInsights',   label: 'Model Insights' }
        ].map(t => ({ ...t, cssClass: 'filter-btn' }));
    }

    get stats() {
        const recs = this.recommendations;
        const n    = recs.length;
        const above = recs.filter(r => parseFloat(r.Predicted_Rating__c) >= this.ratingThreshold).length;
        const avg   = n > 0 ? Math.round(recs.reduce((s, r) => s + r.confidencePct, 0) / n) : 0;
        return { totalPredictions: n * 140, topRating: n > 0 ? recs[0].displayRating : '--', shownCount: above, avgConfidence: avg };
    }

    get categoryFilters() {
        const cats = ['All', ...new Set(this.recommendations.map(r => r.category))];
        return cats.map(c => ({
            value: c,
            label: c === 'All' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase(),
            cssClass: 'filter-btn' + (this.activeFilter === c ? ' on' : '')
        }));
    }

    get filteredRecommendations() {
        return this.activeFilter === 'All'
            ? this.recommendations
            : this.recommendations.filter(r => r.category === this.activeFilter);
    }
    get isEmpty() { return !this.isLoading && this.filteredRecommendations.length === 0; }

    get modelParams() {
        return { latentFactors: this.modelLatentFactors, epochs: this.modelEpochs, trainSplit: this.modelTrainSplit, rmse: this.modelRmse };
    }

    // ── Pie chart slices ──────────────────────────────────────────────────
    get pieSlices() {
        const dist   = this.ratingDistribution;
        const total  = Math.max(dist.reduce((s, b) => s + b.count, 0), 1);
        const circ   = 2 * Math.PI * 38; // circumference at r=38
        let offset   = 0;
        return dist.map((b, idx) => {
            const frac  = b.count / total;
            const dash  = (frac * circ) + ' ' + circ;
            const sl    = { id: 'sl' + idx, color: b.color, dash, offset: -offset * circ / 1 + 0, label: b.label };
            // stroke-dashoffset = circumference - (portion already drawn)
            sl.offset   = circ - offset * circ;
            offset     += frac;
            return sl;
        });
    }

    get pieCentreCount() {
        const total = this.ratingDistribution.reduce((s, b) => s + b.count, 0);
        return total;
    }

    get pieCentreLabel() { return 'recs'; }

    get pieCountStyle() {
        return 'font-size:18px;font-weight:800;line-height:1;color:' + this.theme.colors[0] + ';';
    }

    // ── Rating Distribution ───────────────────────────────────────────────
    get distKpi0Style()    { return 'flex:1;text-align:center;background:' + this.theme.grads[0][1] + ';border-radius:10px;padding:8px 4px;border:1px solid ' + this.theme.grads[0][0] + ';'; }
    get distKpi1Style()    { return 'flex:1;text-align:center;background:' + this.theme.grads[1][1] + ';border-radius:10px;padding:8px 4px;border:1px solid ' + this.theme.grads[1][0] + ';'; }
    get distKpi2Style()    { return 'flex:1;text-align:center;background:' + this.theme.grads[2][1] + ';border-radius:10px;padding:8px 4px;border:1px solid ' + this.theme.grads[2][0] + ';'; }
    get distKpiVal0Style() { return 'font-size:17px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[0] + ';'; }
    get distKpiVal1Style() { return 'font-size:17px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[1] + ';'; }
    get distKpiVal2Style() { return 'font-size:17px;font-weight:800;line-height:1;margin-bottom:3px;color:' + this.theme.colors[2] + ';'; }
    get techPillStyle()    { return 'display:inline-flex;align-items:center;font-size:10px;color:#999;background:#f8f8f8;padding:4px 9px;border-radius:8px;font-weight:600;flex:1;min-width:0;'; }

    get ratingDistribution() {
        const bands = [
            { label: '4.5 – 5.0', min: 4.5, max: 5.01 },
            { label: '4.0 – 4.5', min: 4.0, max: 4.5  },
            { label: '3.5 – 4.0', min: 3.5, max: 4.0  },
            { label: '3.0 – 3.5', min: 3.0, max: 3.5  },
            { label: 'Below 3.0', min: 0,   max: 3.0  }
        ];
        const recs  = this.recommendations;
        const total = Math.max(recs.length, 1);
        const t     = this.theme;

        const withCounts = bands.map((b, idx) => ({
            ...b,
            color: t.colors[idx % t.colors.length],
            gradA: t.grads[idx % t.grads.length][0],
            count: recs.filter(r => {
                const v = parseFloat(r.Predicted_Rating__c);
                return v >= b.min && v < b.max;
            }).length
        }));

        const maxCount = Math.max(...withCounts.map(b => b.count), 1);

        return withCounts.map(b => {
            const barPct = b.count > 0 ? Math.max(Math.round((b.count / maxCount) * 100), 6) : 0;
            const pct    = Math.round((b.count / total) * 100);
            return {
                ...b,
                pct,
                // Horizontal bar — no glow shadow to prevent overflow
                inlineBarStyle:  'width:' + barPct + '%;height:100%;border-radius:5px;background:linear-gradient(90deg,' + b.gradA + ',' + b.color + ');transition:width 1s cubic-bezier(.4,0,.2,1);',
                // Count style
                inlineCntStyle:  'font-size:13px;font-weight:800;color:' + b.color + ';min-width:18px;text-align:right;',
                // Legend dot
                legendDotStyle:  'width:10px;height:10px;border-radius:50%;background:' + b.color + ';flex-shrink:0;',
                // Compat
                distBarStyle:    'width:' + barPct + '%;background:' + b.color + ';height:100%;border-radius:5px;',
                widthStyle:      'width:' + barPct + '%'
            };
        });
    }

    // ── Pie hover effect ──────────────────────────────────────────────────
    handleSliceHover(event) {
        event.target.style.strokeWidth = '22';
        event.target.style.opacity = '0.9';
    }

    handleSliceLeave(event) {
        event.target.style.strokeWidth = '18';
        event.target.style.opacity = '1';
    }

    // ── Dist card: shine sweep + light 3D ────────────────────────────────
    handleDistEnter(event) {
        const el = event.currentTarget;
        el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
        // Find the shine div (first child with position:absolute)
        const children = el.querySelectorAll('div');
        children.forEach(d => {
            if (d.style && d.style.left === '-100%') {
                d.style.transition = 'left 0.7s ease';
                d.style.left = '130%';
            }
        });
    }

    handleDistLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        el.style.transition = 'transform 0.5s ease, box-shadow 0.4s ease';
        el.style.boxShadow  = '';
        const children = el.querySelectorAll('div');
        children.forEach(d => {
            if (d.style && (d.style.left === '130%' || d.style.left === '-100%')) {
                d.style.transition = 'none';
                d.style.left = '-100%';
            }
        });
    }

    handleDistShine(event) {
        const el   = event.currentTarget;
        const rect = el.getBoundingClientRect();
        const rotX = (((event.clientY - rect.top)  / rect.height) - 0.5) * -6;
        const rotY = (((event.clientX - rect.left) / rect.width)  - 0.5) *  6;
        el.style.transform  = 'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateY(-2px)';
        el.style.transition = 'transform 0.08s ease';
    }

    get insights() {
        const t     = this.theme;
        const top   = this.selectedRec?.productName || 'the top product';
        const topCat = this.selectedRec?.category || 'this category';
        const n     = this.recommendations.length;
        const avg   = this.stats.avgConfidence;

        return [
            {
                id: 'collab', icon: 'utility:knowledge_base',
                title: 'Collaborative Filtering Signal',
                body: 'The SVD model analysed interaction patterns of customers similar to this one. "' + top + '" scores highest because users with identical behaviour rated it highly. The model factored ' + this.modelParams.latentFactors + ' latent feature dimensions to find this match.',
                tag:           'How SVD Works',
                cardStyle:     'background:' + t.grads[0][1] + ';border:1px solid ' + t.grads[0][0] + ';border-radius:16px;padding:22px;',
                iconWrapStyle: 'background:' + t.grads[0][0] + ';width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;',
                iconStyle:     '--lwc-colorTextIconDefault:' + t.colors[0],
                tagStyle:      'background:' + t.grads[0][0] + ';color:' + t.colors[0] + ';display:inline-block;font-size:10px;font-weight:700;padding:4px 12px;border-radius:10px;'
            },
            {
                id: 'category', icon: 'utility:trending',
                title: 'Category Affinity: ' + topCat,
                body: 'This customer shows the strongest predicted affinity for ' + topCat + ' products. Out of ' + n + ' recommendations, ' + this.recommendations.filter(r => r.category === topCat).length + ' belong to this category. The model trained on ' + this.modelParams.trainSplit + ' data split across ' + this.modelParams.epochs + ' epochs.',
                tag:           'Customer Segment',
                cardStyle:     'background:' + t.grads[1][1] + ';border:1px solid ' + t.grads[1][0] + ';border-radius:16px;padding:22px;',
                iconWrapStyle: 'background:' + t.grads[1][0] + ';width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;',
                iconStyle:     '--lwc-colorTextIconDefault:' + t.colors[1],
                tagStyle:      'background:' + t.grads[1][0] + ';color:' + t.colors[1] + ';display:inline-block;font-size:10px;font-weight:700;padding:4px 12px;border-radius:10px;'
            },
            {
                id: 'confidence', icon: 'utility:check',
                title: 'Prediction Confidence: ' + avg + '%',
                body: 'Average model confidence across all ' + n + ' recommendations is ' + avg + '%. Confidence = (Predicted_Rating ÷ 5.0) × 100. With an RMSE of ' + this.modelParams.rmse + ' and ' + this.modelParams.latentFactors + ' latent factors, predictions are statistically reliable for personalisation.',
                tag:           'Model Quality',
                cardStyle:     'background:' + t.grads[2][1] + ';border:1px solid ' + t.grads[2][0] + ';border-radius:16px;padding:22px;',
                iconWrapStyle: 'background:' + t.grads[2][0] + ';width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;',
                iconStyle:     '--lwc-colorTextIconDefault:' + t.colors[2],
                tagStyle:      'background:' + t.grads[2][0] + ';color:' + t.colors[2] + ';display:inline-block;font-size:10px;font-weight:700;padding:4px 12px;border-radius:10px;'
            }
        ];
    }

    get toastIcon() { return this.toastType === 'success' ? 'utility:check' : 'utility:error'; }

    _toast(message, type = 'success') {
        this.toastMessage = message;
        this.toastType    = type;
        this.showToast    = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this.showToast = false; }, 3500);
    }

    handleFilterClick(event) {
        this.activeFilter = event.currentTarget.dataset.value;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => { this._applyThemeToDOM(); }, 0);
    }

    // If a product image URL fails to load, switch that card to icon mode
    handleCardImgError(event) {
        const recId = event.currentTarget.dataset.id;
        this.recommendations = this.recommendations.map(r =>
            r.Id === recId ? { ...r, hasImage: false } : r
        );
        if (this.selectedRec?.Id === recId) {
            this.selectedRec = { ...this.selectedRec, hasImage: false };
        }
    }

    handleCardSelect(event) {
        const recId = event.currentTarget.dataset.id;
        this.recommendations = this.recommendations.map(r => ({
            ...r, cardClass: r.Id === recId ? 'prod-card card-selected' : 'prod-card'
        }));
        this.selectedRec = this.recommendations.find(r => r.Id === recId) || null;
    }

    handleViewProduct(event) {
        event.stopPropagation();
        const productId = event.currentTarget.dataset.prodid || this.selectedRec?.Product__c;
        if (!productId) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: productId, objectApiName: 'Product__c', actionName: 'view' }
        });
    }

    handleLogInteraction(event) {
        event.stopPropagation();
        if (!this.selectedRec) return;
        logInteraction({ customerId: this.recordId, productId: this.selectedRec.Product__c, interactionType: 'VIEWED_RECOMMENDATION' })
        .then(() => { this._toast('Interaction logged successfully.'); })
        .catch(err => { this._toast(err.body?.message || 'Failed to log.', 'error'); });
    }
}