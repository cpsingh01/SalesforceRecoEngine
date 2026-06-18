import { LightningElement, api, wire, track } from 'lwc';
import { getRecord }       from 'lightning/uiRecordApi';
import getProductStats     from '@salesforce/apex/RecommendationService.getProductStats';

const FIELDS = [
    'Product__c.Name',
    'Product__c.Category__c',
    'Product__c.Image_URL__c',
    'Product__c.Product_ID__c'
];

// Same 8 themes as the dashboard — random per load
const THEMES = [
    { colors:['#0ea5e9','#6366f1','#06b6d4','#8b5cf6'], grads:[['#bae6fd','#e0f2fe'],['#c7d2fe','#e0e7ff'],['#a5f3fc','#cffafe'],['#ddd6fe','#ede9fe']], hero:'linear-gradient(135deg,#0ea5e9 0%,#6366f1 100%)' },
    { colors:['#f97316','#ec4899','#f59e0b','#ef4444'], grads:[['#fed7aa','#ffedd5'],['#fce7f3','#fdf2f8'],['#fef3c7','#fffbeb'],['#fee2e2','#fff1f2']], hero:'linear-gradient(135deg,#f97316 0%,#ec4899 100%)' },
    { colors:['#10b981','#059669','#34d399','#0d9488'], grads:[['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1'],['#bbf7d0','#dcfce7'],['#6ee7b7','#d1fae5']], hero:'linear-gradient(135deg,#10b981 0%,#0d9488 100%)' },
    { colors:['#8b5cf6','#a855f7','#d946ef','#7c3aed'], grads:[['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff'],['#f5d0fe','#fdf4ff'],['#c4b5fd','#ede9fe']], hero:'linear-gradient(135deg,#8b5cf6 0%,#d946ef 100%)' },
    { colors:['#f59e0b','#d97706','#fbbf24','#b45309'], grads:[['#fde68a','#fef3c7'],['#fed7aa','#ffedd5'],['#fef08a','#fefce8'],['#fca5a5','#fee2e2']], hero:'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)' },
    { colors:['#f43f5e','#e11d48','#fb7185','#be123c'], grads:[['#fecdd3','#fff1f2'],['#fbcfe8','#fdf2f8'],['#fca5a5','#fee2e2'],['#f9a8d4','#fce7f3']], hero:'linear-gradient(135deg,#f43f5e 0%,#8b5cf6 100%)' },
    { colors:['#06b6d4','#0891b2','#22d3ee','#0e7490'], grads:[['#a5f3fc','#cffafe'],['#bae6fd','#e0f2fe'],['#99f6e4','#ccfbf1'],['#7dd3fc','#bae6fd']], hero:'linear-gradient(135deg,#06b6d4 0%,#6366f1 100%)' },
    { colors:['#ec4899','#8b5cf6','#f97316','#06b6d4'], grads:[['#fce7f3','#fdf2f8'],['#ddd6fe','#ede9fe'],['#fed7aa','#ffedd5'],['#a5f3fc','#cffafe']], hero:'linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)' }
];

const CATEGORY_ICONS = {
    'ELECTRONICS':'utility:connected_apps','AUDIO':'utility:volume_high',
    'LAPTOPS':'utility:desktop_and_phone','TABLETS':'utility:tablet_portrait',
    'ACCESSORIES':'utility:gift_card','DISPLAYS':'utility:display_text',
    'MOBILES':'utility:call','WATCHES':'utility:clock','APPAREL':'utility:user',
    'FOOTWEAR':'utility:steps','SHOES':'utility:steps','BAGS':'utility:open_folder',
    'FURNITURE':'utility:home','SPORTS':'utility:activity','GAMING':'utility:games',
    'OTHER':'utility:product','DEFAULT':'utility:product'
};

export default class ProductDetailCard extends LightningElement {
    @api recordId;
    @api modelRmse    = '0.84';
    @api modelFactors = 50;

    @track stats      = null;
    @track isLoading  = true;
    @track imgBroken  = false;

    theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    // Wire product fields
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ data, error }) {
        if (data)  { this._record = data; }
        else if (error) { console.error('Product wire:', error); }
    }

    // Wire stats
    @wire(getProductStats, { productId: '$recordId' })
    wiredStats({ data, error }) {
        this.isLoading = false;
        if (data)  { this.stats = data; }
        else if (error) { console.error('Stats wire:', error); }
    }

    get record() {
    if (!this._record || !this._record.fields) return {};

    const f = this._record.fields;

    return {
        Name: f.Name?.value || '',
        Category__c: f.Category__c?.value || '',
        Image_URL__c: f.Image_URL__c?.value || '',
        Product_ID__c: f.Product_ID__c?.value || ''
    };
}
get imageUrl() {
    return this.record?.Image_URL__c || '';
}

    get statsLoaded() { return !!this.stats; }

   get hasImage() {
    return this.imageUrl && this.imageUrl.startsWith('http');
}
get prodIdStyle() {
    return "font-size:12px;font-family:monospace;margin-bottom:10px;color:#666;";
}
get imageStatus() {
    if (!this.imageUrl) return 'No image URL set';
    if (this.imgBroken) return 'URL expired / broken';
    return 'Available';
}

get imgStatusStyle() {
    if (!this.imageUrl || this.imgBroken) {
        return 'color:#f43f5e;font-weight:700;';
    }
    return 'color:#10b981;font-weight:700;';
}
handleImgError() {
    this.imgBroken = true;
}

    // ── Theme colours ─────────────────────────────────────────────────────
    get themeC0() { return this.theme.colors[0]; }
    get themeC1() { return this.theme.colors[1]; }
    get themeC2() { return this.theme.colors[2]; }
    get themeC3() { return this.theme.colors[3]; }

    // ── Hero styles ────────────────────────────────────────────────────────
    get heroStyle() {
        return 'background:' + this.theme.hero + ';border-radius:18px;padding:28px 24px;margin-bottom:12px;position:relative;overflow:hidden;';
    }
    get imgFrameStyle() {
        return 'width:140px;height:140px;border-radius:20px;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.15);transition:transform 0.15s;transform-style:preserve-3d;';
    }
    get iconPlaceholderStyle() {
        return 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
    }
    get iconColorStyle()  { return '--lwc-colorTextIconDefault:' + this.theme.colors[0]; }
    get catBadgeStyle()   { return 'display:inline-block;font-size:10px;font-weight:800;letter-spacing:0.08em;padding:3px 10px;border-radius:6px;margin-bottom:8px;background:rgba(255,255,255,0.25);color:#fff;'; }
    get catInlineStyle()  { return 'display:inline-block;font-size:10px;font-weight:800;padding:3px 10px;border-radius:6px;background:' + this.theme.grads[0][0] + ';color:' + this.theme.colors[0] + ';'; }
    get heroRatingStyle() { return 'font-size:22px;font-weight:800;color:#fff;'; }
    get heroRecsStyle()   { return 'font-size:12px;color:rgba(255,255,255,0.85);font-weight:600;'; }
    get prodIdStyle()     { return 'font-size:12px;font-family:monospace;color:rgba(255,255,255,0.8);margin-bottom:10px;'; }

    // ── Stat cards ─────────────────────────────────────────────────────────
    get stat0Style() { return 'flex:1 1 120px;border-radius:14px;padding:14px 16px;text-align:center;border:1px solid ' + this.theme.grads[0][0] + ';background:' + this.theme.grads[0][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border-top:3px solid ' + this.theme.colors[0] + ';'; }
    get stat1Style() { return 'flex:1 1 120px;border-radius:14px;padding:14px 16px;text-align:center;border:1px solid ' + this.theme.grads[1][0] + ';background:' + this.theme.grads[1][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border-top:3px solid ' + this.theme.colors[1] + ';'; }
    get stat2Style() { return 'flex:1 1 120px;border-radius:14px;padding:14px 16px;text-align:center;border:1px solid ' + this.theme.grads[2][0] + ';background:' + this.theme.grads[2][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border-top:3px solid ' + this.theme.colors[2] + ';'; }
    get stat3Style() { return 'flex:1 1 120px;border-radius:14px;padding:14px 16px;text-align:center;border:1px solid ' + this.theme.grads[3][0] + ';background:' + this.theme.grads[3][1] + ';transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;border-top:3px solid ' + this.theme.colors[3] + ';'; }
    get sv0() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;color:' + this.theme.colors[0] + ';'; }
    get sv1() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;color:' + this.theme.colors[1] + ';'; }
    get sv2() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;color:' + this.theme.colors[2] + ';'; }
    get sv3() { return 'font-size:26px;font-weight:800;line-height:1;margin-bottom:4px;color:' + this.theme.colors[3] + ';'; }

    // ── Donut arc ─────────────────────────────────────────────────────────
    get arcDash() {
        if (!this.stats?.avgRating) return '0 276.5';
        const circ = 2 * Math.PI * 44;
        const fill = (parseFloat(this.stats.avgRating) / 5) * circ;
        return fill.toFixed(1) + ' ' + circ.toFixed(1);
    }
    get donutNumStyle() { return 'font-size:20px;font-weight:800;color:' + this.theme.colors[0] + ';line-height:1;'; }

    // ── Breakdown bars ─────────────────────────────────────────────────────
    get above4Style() {
        if (!this.stats) return 'width:0%;height:100%;border-radius:4px;';
        const pct = Math.round((this.stats.ratingAbove4 / Math.max(this.stats.totalRecommendations, 1)) * 100);
        return 'width:' + pct + '%;height:100%;border-radius:4px;background:' + this.theme.colors[0] + ';transition:width 1s ease;';
    }
    get above3Style() {
        if (!this.stats) return 'width:0%;height:100%;border-radius:4px;';
        const pct = Math.round((this.stats.ratingAbove3 / Math.max(this.stats.totalRecommendations, 1)) * 100);
        return 'width:' + pct + '%;height:100%;border-radius:4px;background:' + this.theme.colors[1] + ';transition:width 1s ease;';
    }
    get totalFill()   { return 'width:100%;height:100%;border-radius:4px;background:' + this.theme.colors[2] + ';'; }
    get bkV0()        { return 'font-size:11px;font-weight:700;color:' + this.theme.colors[0] + ';'; }
    get bkV1()        { return 'font-size:11px;font-weight:700;color:' + this.theme.colors[1] + ';'; }
    get bkV2()        { return 'font-size:11px;font-weight:700;color:' + this.theme.colors[2] + ';'; }

    // ── Top customer ───────────────────────────────────────────────────────
    get topCustStyle() {
        return 'display:flex;align-items:center;padding:12px 14px;background:' + this.theme.grads[0][1] + ';border-radius:12px;border:1px solid ' + this.theme.grads[0][0] + ';';
    }

    // ── Pills ──────────────────────────────────────────────────────────────
    get pill0S() { return 'display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;background:' + this.theme.grads[0][0] + ';color:' + this.theme.colors[0] + ';'; }
    get pill1S() { return 'display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;background:' + this.theme.grads[1][0] + ';color:' + this.theme.colors[1] + ';'; }
    get pill2S() { return 'display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;background:' + this.theme.grads[2][0] + ';color:' + this.theme.colors[2] + ';'; }

    // ── Confidence bar ────────────────────────────────────────────────────
    get confBarStyle() {
        const pct = this.stats?.confidence || 0;
        return 'width:' + pct + '%;height:100%;border-radius:6px;background:linear-gradient(90deg,' + this.theme.colors[0] + ',' + this.theme.colors[1] + ');transition:width 1s ease;';
    }

    // ── Divider ───────────────────────────────────────────────────────────
    get dividerStyle() { return 'height:1px;background:#f0f0f0;margin:12px 0;'; }

    // ── Stars from avg rating ─────────────────────────────────────────────
    get avgStars() {
        const rating = parseFloat(this.stats?.avgRating) || 0;
        return Array.from({ length: 5 }, (_, i) => ({
            key:      's' + i,
            cssClass: 'star' + (rating >= i+1 ? ' star-filled' : rating >= i+0.5 ? ' star-half' : '')
        }));
    }

    // ── 3D handlers ───────────────────────────────────────────────────────
    handleHeroEnter(event) {
        // Trigger shine sweep
        const shine = this.template.querySelector('.hero-shine');
        if (shine) { shine.style.transition = 'left 0.8s ease'; shine.style.left = '140%'; }
    }
    handleHeroLeave(event) {
        const shine = this.template.querySelector('.hero-shine');
        if (shine) { shine.style.transition = 'none'; shine.style.left = '-100%'; }
        event.currentTarget.style.transform = '';
    }
    handleHeroMove(event) {
        const el = event.currentTarget;
        const r  = el.getBoundingClientRect();
        const rx = (((event.clientY - r.top)  / r.height) - 0.5) * -3;
        const ry = (((event.clientX - r.left) / r.width)  - 0.5) *  3;
        el.style.transform  = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        el.style.transition = 'transform 0.08s ease';
    }

    handleImgEnter(event) { event.currentTarget.style.transform = 'perspective(600px) scale(1.05)'; }
    handleImgLeave(event) { event.currentTarget.style.transform = 'perspective(600px) scale(1)'; event.currentTarget.style.transition = 'transform 0.4s ease'; }
    handleImgMove(event) {
        const el = event.currentTarget;
        const r  = el.getBoundingClientRect();
        const rx = (((event.clientY - r.top)  / r.height) - 0.5) * -12;
        const ry = (((event.clientX - r.left) / r.width)  - 0.5) *  12;
        el.style.transform  = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.04)';
        el.style.transition = 'transform 0.05s ease';
    }

    handleStatEnter(event) { event.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)'; }
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
}