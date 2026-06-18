import { LightningElement, api, wire, track } from 'lwc';
import getProductRatings  from '@salesforce/apex/RecommendationService.getProductRatings';
import getProductDetails  from '@salesforce/apex/RecommendationService.getProductDetails';

// ── 8 random light themes (same as dashboard) ─────────────────────────────
const THEMES = [
    { primary:'#0ea5e9', colors:['#0ea5e9','#6366f1','#06b6d4','#8b5cf6','#0284c7','#4f46e5'], grads:[['#bae6fd','#e0f2fe'],['#c7d2fe','#e0e7ff'],['#a5f3fc','#cffafe'],['#ddd6fe','#ede9fe'],['#bfdbfe','#dbeafe'],['#e9d5ff','#f3e8ff']], avatar:'linear-gradient(135deg,#0ea5e9,#6366f1)' },
    { primary:'#f97316', colors:['#f97316','#ec4899','#f59e0b','#ef4444','#fb923c','#f43f5e'], grads:[['#fed7aa','#ffedd5'],['#fce7f3','#fdf2f8'],['#fef3c7','#fffbeb'],['#fee2e2','#fff1f2'],['#fde8d0','#fff7ed'],['#fcd9e0','#fff0f3']], avatar:'linear-gradient(135deg,#f97316,#ec4899)' },
    { primary:'#10b981', colors:['#10b981','#059669','#34d399','#0d9488','#6ee7b7','#2dd4bf'], grads:[['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1'],['#bbf7d0','#dcfce7'],['#6ee7b7','#d1fae5'],['#a5f3fc','#cffafe'],['#bef264','#ecfccb']], avatar:'linear-gradient(135deg,#10b981,#0d9488)' },
    { primary:'#8b5cf6', colors:['#8b5cf6','#a855f7','#d946ef','#7c3aed','#c084fc','#e879f9'], grads:[['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff'],['#f5d0fe','#fdf4ff'],['#c4b5fd','#ede9fe'],['#f0abfc','#fdf4ff'],['#d8b4fe','#f3e8ff']], avatar:'linear-gradient(135deg,#8b5cf6,#d946ef)' },
    { primary:'#f59e0b', colors:['#f59e0b','#d97706','#fbbf24','#b45309','#fcd34d','#f97316'], grads:[['#fde68a','#fef3c7'],['#fed7aa','#ffedd5'],['#fef08a','#fefce8'],['#fca5a5','#fee2e2'],['#fdba74','#fff7ed'],['#fcd34d','#fffbeb']], avatar:'linear-gradient(135deg,#f59e0b,#f97316)' },
    { primary:'#f43f5e', colors:['#f43f5e','#e11d48','#fb7185','#be123c','#fda4af','#f9a8d4'], grads:[['#fecdd3','#fff1f2'],['#fbcfe8','#fdf2f8'],['#fca5a5','#fee2e2'],['#f9a8d4','#fce7f3'],['#fecaca','#fef2f2'],['#f5d0fe','#fdf4ff']], avatar:'linear-gradient(135deg,#f43f5e,#8b5cf6)' },
    { primary:'#06b6d4', colors:['#06b6d4','#0891b2','#22d3ee','#0e7490','#67e8f9','#a5f3fc'], grads:[['#a5f3fc','#cffafe'],['#bae6fd','#e0f2fe'],['#99f6e4','#ccfbf1'],['#7dd3fc','#bae6fd'],['#6ee7b7','#d1fae5'],['#c7d2fe','#e0e7ff']], avatar:'linear-gradient(135deg,#06b6d4,#6366f1)' },
    { primary:'#ec4899', colors:['#ec4899','#8b5cf6','#f97316','#06b6d4','#10b981','#f59e0b'], grads:[['#fce7f3','#fdf2f8'],['#ddd6fe','#ede9fe'],['#fed7aa','#ffedd5'],['#a5f3fc','#cffafe'],['#a7f3d0','#d1fae5'],['#fef3c7','#fffbeb']], avatar:'linear-gradient(135deg,#ec4899,#8b5cf6)' }
];

const CATEGORY_ICONS = {
    'ELECTRONICS':'utility:connected_apps','AUDIO':'utility:volume_high',
    'LAPTOPS':'utility:desktop_and_phone','TABLETS':'utility:tablet_portrait',
    'ACCESSORIES':'utility:gift_card','DISPLAYS':'utility:display_text',
    'MOBILES':'utility:call','WATCHES':'utility:clock','APPAREL':'utility:user',
    'FOOTWEAR':'utility:steps','SHOES':'utility:steps','BAGS':'utility:open_folder',
    'FURNITURE':'utility:home','SPORTS':'utility:activity','GAMING':'utility:games',
    'BOOKS':'utility:knowledge_base','OTHER':'utility:product','DEFAULT':'utility:product'
};

export default class ProductRatingDisplay extends LightningElement {

    @api recordId;            // Product__c record Id
    @api maxCustomers = 10;   // how many customer rows to show

    @track product       = null;
    @track ratings       = [];
    @track isLoading     = true;
    @track imageError    = false;

    theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    // ── Wire: Product__c ──────────────────────────────────────────────────
    @wire(getProductDetails, { productId: '$recordId' })
    wiredProduct({ data, error }) {
        if (data)  { this.product = data; }
        else if (error) { console.error('Product wire:', error); }
    }

    // ── Wire: Recommendation__c ratings ───────────────────────────────────
    @wire(getProductRatings, { productId: '$recordId', maxResults: '$maxCustomers' })
    wiredRatings({ data, error }) {
        this.isLoading = false;
        if (data)  { this.ratings = data; }
        else if (error) { console.error('Ratings wire:', error); }
    }

    // ── Image ─────────────────────────────────────────────────────────────
    get hasImage() {
        return !this.imageError && this.product?.Image_URL__c
            && (this.product.Image_URL__c.startsWith('http') || this.product.Image_URL__c.startsWith('/'));
    }
    handleImageError() { this.imageError = true; }

    get categoryIcon() {
        const cat = (this.product?.Category__c || 'DEFAULT').toUpperCase();
        return CATEGORY_ICONS[cat] || CATEGORY_ICONS.DEFAULT;
    }

    // ── Theme-driven computed styles ──────────────────────────────────────
    get logoBgStyle()      { return 'width:32px;height:32px;border-radius:9px;background:' + this.theme.primary + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;'; }
    get livePillStyle()    { return 'display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;background:' + this.theme.grads[0][0] + ';color:' + this.theme.colors[0] + ';padding:3px 10px;border-radius:20px;'; }
    get liveDotStyle()     { return 'width:6px;height:6px;background:' + this.theme.primary + ';border-radius:50%;display:inline-block;'; }
    get bigRatingStyle()   { return 'font-size:42px;font-weight:800;line-height:1;color:' + this.theme.colors[0] + ';'; }
    get ratingLabelStyle() { return 'font-size:11px;color:#aaa;font-weight:600;'; }
    get categoryIconStyle(){ return '--lwc-colorTextIconDefault:' + this.theme.colors[0] + ';'; }

    get catBadgeStyle() {
        return 'position:absolute;bottom:8px;left:8px;font-size:9px;font-weight:800;letter-spacing:0.08em;background:rgba(255,255,255,0.92);color:' + this.theme.colors[0] + ';padding:3px 10px;border-radius:8px;';
    }

    get productImgBgStyle() {
        return 'width:140px;height:140px;min-width:140px;border-radius:16px;background:' + this.theme.grads[0][1] + ';display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;flex-shrink:0;transition:transform 0.3s;box-shadow:0 4px 16px rgba(0,0,0,0.1);';
    }

    // Stat chips
    get chip0Style() { return 'flex:1;text-align:center;background:' + this.theme.grads[0][1] + ';border-radius:10px;padding:8px 6px;border:1px solid ' + this.theme.grads[0][0] + ';min-width:0;'; }
    get chip1Style() { return 'flex:1;text-align:center;background:' + this.theme.grads[1][1] + ';border-radius:10px;padding:8px 6px;border:1px solid ' + this.theme.grads[1][0] + ';min-width:0;'; }
    get chip2Style() { return 'flex:1;text-align:center;background:' + this.theme.grads[2][1] + ';border-radius:10px;padding:8px 6px;border:1px solid ' + this.theme.grads[2][0] + ';min-width:0;'; }
    get chipVal0Style() { return 'font-size:18px;font-weight:800;color:' + this.theme.colors[0] + ';line-height:1;margin-bottom:3px;'; }
    get chipVal1Style() { return 'font-size:18px;font-weight:800;color:' + this.theme.colors[1] + ';line-height:1;margin-bottom:3px;'; }
    get chipVal2Style() { return 'font-size:18px;font-weight:800;color:' + this.theme.colors[2] + ';line-height:1;margin-bottom:3px;'; }

    // Insight cards
    get insightCard0Style() { return 'background:' + this.theme.grads[0][1] + ';border:1px solid ' + this.theme.grads[0][0] + ';border-radius:14px;padding:18px;height:100%;transition:transform 0.3s,box-shadow 0.2s;'; }
    get insightCard1Style() { return 'background:' + this.theme.grads[1][1] + ';border:1px solid ' + this.theme.grads[1][0] + ';border-radius:14px;padding:18px;height:100%;transition:transform 0.3s,box-shadow 0.2s;'; }
    get insightCard2Style() { return 'background:' + this.theme.grads[2][1] + ';border:1px solid ' + this.theme.grads[2][0] + ';border-radius:14px;padding:18px;height:100%;transition:transform 0.3s,box-shadow 0.2s;'; }
    get insightIcon0Style() { return 'width:46px;height:46px;border-radius:14px;background:' + this.theme.grads[0][0] + ';display:flex;align-items:center;justify-content:center;margin-bottom:12px;'; }
    get insightIcon1Style() { return 'width:46px;height:46px;border-radius:14px;background:' + this.theme.grads[1][0] + ';display:flex;align-items:center;justify-content:center;margin-bottom:12px;'; }
    get insightIcon2Style() { return 'width:46px;height:46px;border-radius:14px;background:' + this.theme.grads[2][0] + ';display:flex;align-items:center;justify-content:center;margin-bottom:12px;'; }
    get insightIconColor0() { return '--lwc-colorTextIconDefault:' + this.theme.colors[0] + ';'; }
    get insightIconColor1() { return '--lwc-colorTextIconDefault:' + this.theme.colors[1] + ';'; }
    get insightIconColor2() { return '--lwc-colorTextIconDefault:' + this.theme.colors[2] + ';'; }
    get insightTag0Style()  { return 'display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;margin-top:12px;background:' + this.theme.grads[0][0] + ';color:' + this.theme.colors[0] + ';'; }
    get insightTag1Style()  { return 'display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;margin-top:12px;background:' + this.theme.grads[1][0] + ';color:' + this.theme.colors[1] + ';'; }
    get insightTag2Style()  { return 'display:inline-block;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;margin-top:12px;background:' + this.theme.grads[2][0] + ';color:' + this.theme.colors[2] + ';'; }

    // ── Data computed properties ──────────────────────────────────────────
    get hasRatings()         { return this.ratings && this.ratings.length > 0; }
    get totalRecommendations(){ return this.ratings.length; }

    get avgRating() {
        if (!this.hasRatings) return '--';
        const avg = this.ratings.reduce((s, r) => s + parseFloat(r.Predicted_Rating__c || 0), 0) / this.ratings.length;
        return avg.toFixed(2);
    }

    get maxRating() {
        if (!this.hasRatings) return '--';
        return Math.max(...this.ratings.map(r => parseFloat(r.Predicted_Rating__c || 0))).toFixed(2);
    }

    get avgConfidence() {
        if (!this.hasRatings) return 0;
        const avg = this.ratings.reduce((s, r) => s + parseFloat(r.Predicted_Rating__c || 0), 0) / this.ratings.length;
        return Math.round((avg / 5) * 100);
    }

    get avgStars() {
        return this._buildStars(parseFloat(this.avgRating) || 0, 16);
    }

    _buildStars(rating, size = 12) {
        return Array.from({ length: 5 }, (_, i) => {
            const filled = rating >= i + 1;
            const half   = !filled && rating >= i + 0.5;
            const color  = (filled || half) ? '#f59e0b' : '#e5e7eb';
            return {
                key: 's' + i,
                style: 'display:inline-block;width:' + size + 'px;height:' + size + 'px;background:' + color + ';clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);'
            };
        });
    }

    get customerRatings() {
        const maxR = Math.max(...this.ratings.map(r => parseFloat(r.Predicted_Rating__c || 0)), 5);
        return this.ratings.map((rec, idx) => {
            const rating   = parseFloat(rec.Predicted_Rating__c || 0);
            const barPct   = Math.round((rating / maxR) * 100);
            const color    = this.theme.colors[idx % this.theme.colors.length];
            const gradA    = this.theme.grads[idx % this.theme.grads.length][0];
            const custName = rec.Customer__r?.Name || rec.External_Customer_ID__c || ('User ' + (idx + 1));
            const initials = custName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

            return {
                customerId:   rec.Customer__c || rec.Id,
                customerName: custName,
                initials,
                rating:       rating.toFixed(2),
                rowStyle:     'display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:6px 8px;border-radius:8px;transition:background 0.2s,transform 0.15s;cursor:default;',
                avatarStyle:  'width:28px;height:28px;min-width:28px;border-radius:50%;background:' + this.theme.avatar + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;',
                barStyle:     'width:' + barPct + '%;height:100%;border-radius:6px;background:linear-gradient(90deg,' + gradA + ',' + color + ');transition:width 0.8s cubic-bezier(.4,0,.2,1);',
                scoreStyle:   'font-size:12px;font-weight:800;color:' + color + ';min-width:30px;text-align:right;flex-shrink:0;',
                miniStars:    this._buildStars(rating, 9)
            };
        });
    }

    get insights() {
        const total  = this.totalRecommendations;
        const avg    = this.avgRating;
        const conf   = this.avgConfidence;
        const prodName = this.product?.Name || 'this product';
        return {
            demandBody:      prodName + ' has been recommended to ' + total + ' customers by the SVD model. Average predicted rating of ' + avg + '/5.0 places it in the ' + (parseFloat(avg) >= 4 ? 'high' : parseFloat(avg) >= 3 ? 'medium' : 'low') + ' demand tier.',
            reachBody:       'Collaborative filtering found ' + total + ' customers with similar behaviour who would likely rate this product. The model used purchase and interaction history to identify these matches.',
            confidenceBody:  'Average model confidence is ' + conf + '% (Predicted_Rating ÷ 5 × 100). This means the SVD algorithm has ' + (conf >= 75 ? 'strong' : conf >= 60 ? 'moderate' : 'developing') + ' signal for predicting this product\'s reception.'
        };
    }

    // ── 3D hover handlers ─────────────────────────────────────────────────
    handle3DEnter(event) {
        event.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
    }
    handle3DLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
        el.style.boxShadow  = '';
        el.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
    }
    handle3DMove(event) {
        const el   = event.currentTarget;
        const rect = el.getBoundingClientRect();
        const rotX = (((event.clientY - rect.top)  / rect.height) - 0.5) * -6;
        const rotY = (((event.clientX - rect.left) / rect.width)  - 0.5) *  6;
        el.style.transform  = 'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
        el.style.transition = 'transform 0.08s ease';
    }

    handleRowEnter(event) {
        event.currentTarget.style.background = this.theme.grads[0][1];
        event.currentTarget.style.transform  = 'translateX(3px)';
    }
    handleRowLeave(event) {
        event.currentTarget.style.background = 'transparent';
        event.currentTarget.style.transform  = 'translateX(0)';
    }
    handleImgEnter(event) {
        event.currentTarget.style.transform = 'scale(1.04)';
    }
    handleImgLeave(event) {
        event.currentTarget.style.transform = 'scale(1)';
    }
}