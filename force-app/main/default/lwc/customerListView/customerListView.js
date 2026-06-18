import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getAllCustomers from '@salesforce/apex/RecommendationService.getAllCustomers';

const THEMES = [
    { hero:'linear-gradient(135deg,#0ea5e9,#6366f1)', colors:['#0ea5e9','#6366f1','#06b6d4','#8b5cf6','#0284c7','#4f46e5'], grads:[['#bae6fd','#e0f2fe'],['#c7d2fe','#e0e7ff'],['#a5f3fc','#cffafe'],['#ddd6fe','#ede9fe']] },
    { hero:'linear-gradient(135deg,#f97316,#ec4899)', colors:['#f97316','#ec4899','#f59e0b','#ef4444','#fb923c','#f43f5e'], grads:[['#fed7aa','#ffedd5'],['#fce7f3','#fdf2f8'],['#fef3c7','#fffbeb'],['#fee2e2','#fff1f2']] },
    { hero:'linear-gradient(135deg,#10b981,#0d9488)', colors:['#10b981','#059669','#34d399','#0d9488','#6ee7b7','#2dd4bf'], grads:[['#a7f3d0','#d1fae5'],['#99f6e4','#ccfbf1'],['#bbf7d0','#dcfce7'],['#6ee7b7','#d1fae5']] },
    { hero:'linear-gradient(135deg,#8b5cf6,#d946ef)', colors:['#8b5cf6','#a855f7','#d946ef','#7c3aed','#c084fc','#e879f9'], grads:[['#ddd6fe','#ede9fe'],['#e9d5ff','#f3e8ff'],['#f5d0fe','#fdf4ff'],['#c4b5fd','#ede9fe']] }
];

const TIER_STYLES = {
    'Premium':  'background:#fef3c7;color:#92400e;',
    'Gold':     'background:#fef3c7;color:#92400e;',
    'Silver':   'background:#f1f5f9;color:#475569;',
    'Bronze':   'background:#fef3c7;color:#b45309;',
    'Standard': 'background:#f0f9ff;color:#0369a1;',
    'DEFAULT':  'background:#f8fafc;color:#64748b;'
};

export default class CustomerListView extends NavigationMixin(LightningElement) {

    @track customers    = [];
    @track searchQuery  = '';
    @track isLoading    = true;
    @track viewMode     = 'grid'; // 'grid' | 'list'

    theme = THEMES[Math.floor(Math.random() * THEMES.length)];

    @wire(getAllCustomers)
    wiredCustomers({ data, error }) {
        this.isLoading = false;
        if (data) {
            const maxRec = Math.max(...data.map(c => c.recCount || 0), 1);
            this.customers = data.map((c, idx) => this._enrich(c, idx, maxRec));
        } else if (error) {
            console.error('CustomerListView wire:', error);
        }
    }

    _enrich(c, idx, maxRec) {
        const t       = this.theme;
        const color   = t.colors[idx % t.colors.length];
        const grad    = t.grads[idx % t.grads.length];
        const initials = (c.Name || '??').trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
        const recCount = c.recCount || 0;
        const barPct   = Math.max(Math.round((recCount / maxRec) * 100), recCount > 0 ? 8 : 0);

        return {
            ...c,
            rank:         idx + 1,
            initials,
            hdrStyle:     'background:linear-gradient(135deg,' + grad[0] + ',' + color + ');height:80px;position:relative;display:flex;align-items:center;justify-content:center;',
            avatarStyle:  'width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;background:' + color + ';border:3px solid rgba(255,255,255,0.7);flex-shrink:0;',
            rankStyle:    'position:absolute;top:8px;right:10px;font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px;background:rgba(255,255,255,0.3);color:#fff;',
            idStyle:      'font-size:10px;font-family:monospace;margin-bottom:8px;color:' + color + ';',
            tierStyle:    (TIER_STYLES[c.tier || 'DEFAULT'] || TIER_STYLES.DEFAULT) + 'display:inline-block;font-size:9px;font-weight:800;padding:2px 8px;border-radius:6px;margin-bottom:10px;',
            External_Customer_ID__c: c.externalCustomerId || '',
            Tier__c:      c.tier || '',
            recCount,
            recCountStyle:'font-size:11px;font-weight:700;color:' + color,
            recBarStyle:  'width:' + barPct + '%;height:100%;border-radius:3px;background:' + color + ';transition:width 0.8s ease;',
            openBtnStyle: 'width:100%;font-size:12px;font-weight:700;padding:8px;border-radius:9px;border:none;cursor:pointer;color:#fff;background:' + color + ';',
            tdRankStyle:  'font-weight:700;color:' + color + ';font-size:13px;',
            tblBtnStyle:  'font-size:11px;font-weight:700;padding:5px 12px;border-radius:8px;border:none;cursor:pointer;color:#fff;background:' + color + ';'
        };
    }

    // ── Search ────────────────────────────────────────────────────────────
    handleSearch(event) { this.searchQuery = event.target.value; }
    handleClearSearch() { this.searchQuery = ''; }

    get filteredCustomers() {
        if (!this.searchQuery) return this.customers;
        const q = this.searchQuery.toLowerCase();
        return this.customers.filter(c =>
            (c.Name || '').toLowerCase().includes(q) ||
            (c.External_Customer_ID__c || '').toLowerCase().includes(q)
        );
    }
    get isEmpty()    { return !this.isLoading && this.filteredCustomers.length === 0; }
    get totalCount() { return this.customers.length; }
    get shownCount() { return this.filteredCustomers.length; }

    // ── View toggle ───────────────────────────────────────────────────────
    get isGridView() { return this.viewMode === 'grid'; }
    get isListView() { return this.viewMode === 'list'; }
    handleGridView() { this.viewMode = 'grid'; }
    handleListView() { this.viewMode = 'list'; }

    get gridBtnClass() { return 'view-btn' + (this.isGridView ? ' active' : ''); }
    get listBtnClass() { return 'view-btn' + (this.isListView ? ' active' : ''); }
    get gridBtnStyle() { return this.isGridView ? 'background:' + this.theme.colors[0] + ';' : 'background:#fff;'; }
    get listBtnStyle() { return this.isListView ? 'background:' + this.theme.colors[0] + ';' : 'background:#fff;'; }
    get toggleIconStyle() { return '--lwc-colorTextIconDefault:' + (this.isGridView ? '#fff' : '#999') + ';'; }

    // ── Theme styles ──────────────────────────────────────────────────────
    get heroStyle()      { return 'background:' + this.theme.hero + ';border-radius:18px;padding:28px 24px;margin-bottom:12px;position:relative;overflow:hidden;'; }
    get hStat0()         { return 'text-align:center;padding:12px 18px;border-radius:14px;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);min-width:80px;'; }
    get hStat1()         { return 'text-align:center;padding:12px 18px;border-radius:14px;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);min-width:80px;'; }
    get hStat2()         { return 'text-align:center;padding:12px 18px;border-radius:14px;background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);min-width:80px;'; }
    get searchWrapStyle(){ return 'flex:1;min-width:220px;display:flex;align-items:center;border-radius:12px;padding:0 12px;border:1.5px solid ' + this.theme.colors[0] + '44;background:#fff;gap:8px;height:40px;'; }
    get searchIconStyle(){ return '--lwc-colorTextIconDefault:' + this.theme.colors[0] + ';'; }
    get clearBtnStyle()  { return 'border:none;background:none;cursor:pointer;font-size:13px;font-weight:700;padding:2px 6px;border-radius:6px;color:' + this.theme.colors[0] + ';'; }
    get newBtnStyle()    { return '--sds-c-button-brand-color-background:' + this.theme.colors[0] + ';--sds-c-button-brand-color-border:' + this.theme.colors[0] + ';'; }
    get thStyle()        { return 'padding:12px 16px;text-align:left;border-bottom:2px solid ' + this.theme.grads[0][0] + ';font-size:10px;letter-spacing:0.07em;font-weight:700;color:' + this.theme.colors[0] + ';'; }

    // ── Navigation ────────────────────────────────────────────────────────
    handleOpenCustomer(event) {
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        if (!id) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: id, objectApiName: 'Customer__c', actionName: 'view' }
        });
    }

    handleNew() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Customer__c', actionName: 'new' }
        });
    }

    // ── 3D Card hover ─────────────────────────────────────────────────────
    handleCardEnter(event) { event.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.14)'; }
    handleCardLeave(event) {
        const el = event.currentTarget;
        el.style.transform  = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
        el.style.boxShadow  = '0 2px 8px rgba(0,0,0,0.05)';
        el.style.transition = 'transform 0.4s ease, box-shadow 0.3s ease';
    }
    handleCardMove(event) {
        const el = event.currentTarget;
        const r  = el.getBoundingClientRect();
        const rx = (((event.clientY - r.top)  / r.height) - 0.5) * -8;
        const ry = (((event.clientX - r.left) / r.width)  - 0.5) *  8;
        el.style.transform  = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.02)';
        el.style.transition = 'transform 0.08s ease';
    }
}