import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getRecommendationDetails from '@salesforce/apex/RecommendationService.getRecommendationDetails';

const THEMES = [
    { hero:'linear-gradient(135deg,#0ea5e9,#6366f1)', colors:['#0ea5e9','#6366f1','#06b6d4','#8b5cf6'], grads:[['#bae6fd','#e0f2fe'],['#c7d2fe','#e0e7ff'],['#a5f3fc','#cffafe'],['#ddd6fe','#ede9fe']] },
    { hero:'linear-gradient(135deg,#f97316,#ec4899)', colors:['#f97316','#ec4899','#f59e0b','#ef4444'], grads:[['#fed7aa','#ffedd5'],['#fce7f3','#fdf2f8'],['#fef3c7','#fffbeb'],['#fee2e2','#fff1f2']] },
    { hero:'linear-gradient(135deg,#10b981,#0d9488)', colors:['#10b981','#059669','#34d399','#0d9488'], grads:[['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1'],['#bbf7d0','#dcfce7'],['#6ee7b7','#d1fae5']] },
    { hero:'linear-gradient(135deg,#8b5cf6,#d946ef)', colors:['#8b5cf6','#a855f7','#d946ef','#7c3aed'], grads:[['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff'],['#f5d0fe','#fdf4ff'],['#c4b5fd','#ede9fe']] },
    { hero:'linear-gradient(135deg,#f59e0b,#f97316)', colors:['#f59e0b','#d97706','#fbbf24','#b45309'], grads:[['#fde68a','#fef3c7'],['#fed7aa','#ffedd5'],['#fef08a','#fefce8'],['#fca5a5','#fee2e2']] },
    { hero:'linear-gradient(135deg,#f43f5e,#8b5cf6)', colors:['#f43f5e','#e11d48','#fb7185','#be123c'], grads:[['#fecdd3','#fff1f2'],['#fbcfe8','#fdf2f8'],['#fca5a5','#fee2e2'],['#f9a8d4','#fce7f3']] }
];

export default class RecDetailCard extends NavigationMixin(LightningElement) {
    @api recordId;

    _rec       = null;
    isLoading  = true;
    theme      = THEMES[Math.floor(Math.random() * THEMES.length)];

    // ── Wire via Apex — gets relationship fields reliably ─────────────────
    @wire(getRecommendationDetails, { recId: '$recordId' })
    wiredRec({ data, error }) {
        this.isLoading = false;
        if (data) {
            this._rec = data;
        } else if (error) {
            console.error('RecDetailCard wire error:', error);
        }
    }

    // ── Safe record getter ────────────────────────────────────────────────
    get record() {
        if (!this._rec) return {
            Name: '--', Predicted_Rating__c: 0,
            CustomerName: '--', ProductName: '--',
            ProductCategory: '--', Product_ID__c: '--',
            Customer__c: '--', Product__c: '--'
        };
        return {
            Name:            this._rec.Name,
            Predicted_Rating__c: this._rec.Predicted_Rating__c || 0,
            Customer__c:     this._rec.Customer__c,
            CustomerName:    this._rec.Customer__r?.Name || '--',
            Product__c:      this._rec.Product__c,
            ProductName:     this._rec.Product__r?.Name || '--',
            ProductCategory: this._rec.Product__r?.Category__c || '--',
            Product_ID__c:   this._rec.Product__r?.Product_ID__c || this._rec.Product__c || '--'
        };
    }

    get displayRating() {
        return parseFloat(this.record.Predicted_Rating__c || 0).toFixed(2);
    }
    get confidencePct() {
        return Math.round((parseFloat(this.record.Predicted_Rating__c) || 0) / 5 * 100);
    }

    // ── Rating ring arc ───────────────────────────────────────────────────
    get ratingArc() {
        const circ = 2 * Math.PI * 50;
        const fill = ((parseFloat(this.record.Predicted_Rating__c) || 0) / 5) * circ;
        return fill.toFixed(1) + ' ' + circ.toFixed(1);
    }

    // ── Stars ─────────────────────────────────────────────────────────────
    get ratingStars() {
        const r = parseFloat(this.record.Predicted_Rating__c) || 0;
        return Array.from({ length: 5 }, (_, i) => ({
            key: 's' + i,
            cssClass: 'star' + (r >= i+1 ? ' star-filled' : r >= i+0.5 ? ' star-half' : '')
        }));
    }

    // ── All theme-driven inline styles ────────────────────────────────────
    get heroStyle()         { return 'background:' + this.theme.hero + ';border-radius:18px;padding:28px 24px;margin-bottom:12px;position:relative;overflow:hidden;'; }
    get ratingBigStyle()    { return 'font-weight:800;color:' + this.theme.colors[0] + ';'; }
    get catPillStyle()      { return 'display:inline-block;font-size:10px;font-weight:800;padding:3px 10px;border-radius:6px;background:' + this.theme.grads[0][0] + ';color:' + this.theme.colors[0] + ';'; }
    get confBarStyle()      { return 'width:' + this.confidencePct + '%;height:100%;border-radius:6px;background:linear-gradient(90deg,' + this.theme.colors[0] + ',' + this.theme.colors[1] + ');transition:width 1s ease;'; }
    get insightBoxStyle()   { return 'background:' + this.theme.grads[0][1] + ';border-radius:12px;padding:14px;border:1px solid ' + this.theme.grads[0][0] + ';margin-top:4px;'; }
    get pill0S()            { return 'font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;background:rgba(255,255,255,0.25);color:#fff;'; }
    get pill1S()            { return 'font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);'; }

    // Link cards — cursor:pointer to show they are clickable
    get custCardStyle()     { return 'flex:1 1 200px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;background:' + this.theme.grads[0][1] + ';border:1px solid ' + this.theme.grads[0][0] + ';border-top:3px solid ' + this.theme.colors[0] + ';cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get prodCardStyle()     { return 'flex:1 1 200px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;background:' + this.theme.grads[1][1] + ';border:1px solid ' + this.theme.grads[1][0] + ';border-top:3px solid ' + this.theme.colors[1] + ';cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get ratingCardStyle()   { return 'flex:1 1 200px;border-radius:16px;padding:16px;display:flex;align-items:center;gap:14px;background:' + this.theme.grads[2][1] + ';border:1px solid ' + this.theme.grads[2][0] + ';border-top:3px solid ' + this.theme.colors[2] + ';cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;transform-style:preserve-3d;'; }
    get custIconWrap()      { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[0][0] + ';'; }
    get prodIconWrap()      { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[1][0] + ';'; }
    get ratingIconWrap()    { return 'width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + this.theme.grads[2][0] + ';'; }
    get icon0Style()        { return '--lwc-colorTextIconDefault:' + this.theme.colors[0] + ';'; }
    get icon1Style()        { return '--lwc-colorTextIconDefault:' + this.theme.colors[1] + ';'; }
    get icon2Style()        { return '--lwc-colorTextIconDefault:' + this.theme.colors[2] + ';'; }
    get icon3Style()        { return '--lwc-colorTextIconDefault:' + this.theme.colors[3] + ';'; }
    get arrow0Style()       { return 'font-size:20px;font-weight:800;color:' + this.theme.colors[0] + ';'; }
    get arrow1Style()       { return 'font-size:20px;font-weight:800;color:' + this.theme.colors[1] + ';'; }
    get arrow2Style()       { return 'font-size:20px;font-weight:800;color:' + this.theme.colors[2] + ';'; }

    // Model boxes
    get mBox0() { return 'border-radius:12px;padding:14px;border:1px solid ' + this.theme.grads[0][0] + ';background:' + this.theme.grads[0][1] + ';transition:transform 0.2s;border-top:3px solid ' + this.theme.colors[0] + ';'; }
    get mBox1() { return 'border-radius:12px;padding:14px;border:1px solid ' + this.theme.grads[1][0] + ';background:' + this.theme.grads[1][1] + ';transition:transform 0.2s;border-top:3px solid ' + this.theme.colors[1] + ';'; }
    get mBox2() { return 'border-radius:12px;padding:14px;border:1px solid ' + this.theme.grads[2][0] + ';background:' + this.theme.grads[2][1] + ';transition:transform 0.2s;border-top:3px solid ' + this.theme.colors[2] + ';'; }
    get mBox3() { return 'border-radius:12px;padding:14px;border:1px solid ' + this.theme.grads[3][0] + ';background:' + this.theme.grads[3][1] + ';transition:transform 0.2s;border-top:3px solid ' + this.theme.colors[3] + ';'; }

    // ── Navigation handlers ───────────────────────────────────────────────
    handleOpenCustomer() {
        const id = this.record.Customer__c;
        if (!id) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Customer__c', actionName: 'view' }
        });
    }

    handleOpenProduct() {
        const id = this.record.Product__c;
        if (!id) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Product__c', actionName: 'view' }
        });
    }

    handleOpenRating() {
        // Navigate to this same Recommendation record's details tab
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.recordId, objectApiName: 'Recommendation__c', actionName: 'view' }
        });
    }

    // ── 3D mouse handlers ─────────────────────────────────────────────────
    handleHeroEnter(event) {
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
    handleCardEnter(event) { event.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }
    handleCardLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
        el.style.boxShadow  = '';
        el.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
    }
    handleCardMove(event) {
        const el = event.currentTarget;
        const r  = el.getBoundingClientRect();
        const rx = (((event.clientY - r.top)  / r.height) - 0.5) * -7;
        const ry = (((event.clientX - r.left) / r.width)  - 0.5) *  7;
        el.style.transform  = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.02)';
        el.style.transition = 'transform 0.08s ease';
    }
}