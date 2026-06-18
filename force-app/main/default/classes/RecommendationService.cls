/**
 * RecommendationService
 * ─────────────────────────────────────────────────────────────────────────────
 * Single Apex class serving all LWC components in the RecoEngine project.
 *
 *  Components served:
 *   - aiRecommendationDashboard   (Customer__c record page)
 *   - productDetailCard           (Product__c record page)
 *   - productRatingDisplay        (Product__c record page)
 *   - ProductDetailService        (legacy wrapper — kept for compatibility)
 * ─────────────────────────────────────────────────────────────────────────────
 */
public with sharing class RecommendationService {

    // ── getRecommendations ────────────────────────────────────────────────
    @AuraEnabled(cacheable=true)
    public static List<Recommendation__c> getRecommendations(
        Id customerId, Integer maxResults
    ) {
        if (customerId == null) {
            throw new AuraHandledException('customerId is required.');
        }
        Integer lim = (maxResults != null && maxResults > 0) ? maxResults : 6;
        try {
            return [
                SELECT Id, Predicted_Rating__c, Customer__c, Product__c,
                       Product__r.Name, Product__r.Category__c, Product__r.Image_URL__c
                FROM Recommendation__c
                WHERE Customer__c = :customerId
                ORDER BY Predicted_Rating__c DESC NULLS LAST
                LIMIT :lim
            ];
        } catch (QueryException e) {
            throw new AuraHandledException('Error querying Recommendation__c: ' + e.getMessage());
        }
    }

    // ── getCustomerDetails ────────────────────────────────────────────────
    @AuraEnabled(cacheable=true)
    public static Customer__c getCustomerDetails(Id customerId) {
        if (customerId == null) {
            throw new AuraHandledException('customerId is required.');
        }
        List<Customer__c> results = [
            SELECT Id, Name
            FROM Customer__c
            WHERE Id = :customerId
            LIMIT 1
        ];
        if (results.isEmpty()) {
            throw new AuraHandledException('Customer not found: ' + customerId);
        }
        return results[0];
    }

    // ── logInteraction ────────────────────────────────────────────────────
    @AuraEnabled
    public static void logInteraction(
        Id customerId, Id productId, String interactionType
    ) {
        if (customerId == null || productId == null) {
            throw new AuraHandledException('customerId and productId are required.');
        }
        System.debug('logInteraction: customer=' + customerId
            + ' product=' + productId + ' type=' + interactionType);
    }

    // ── getAnalyticsData ──────────────────────────────────────────────────
    // Called by analyticsBoard LWC — all chart data in one call
    @AuraEnabled(cacheable=true)
    public static AnalyticsDTO getAnalyticsData() {
        AnalyticsDTO dto = new AnalyticsDTO();

        dto.totalCustomers = [SELECT COUNT() FROM Customer__c];
        dto.totalProducts  = [SELECT COUNT() FROM Product__c];
        dto.totalRecs      = [SELECT COUNT() FROM Recommendation__c];

        // Avg rating
        List<AggregateResult> avgRes = [SELECT AVG(Predicted_Rating__c) a FROM Recommendation__c WHERE Predicted_Rating__c != null];
        dto.avgRating = avgRes.isEmpty() || avgRes[0].get('a') == null ? '0.00' : ((Decimal)avgRes[0].get('a')).setScale(2).toPlainString();

        // Top 8 products by recommendation count
        dto.topProducts = new List<ProductCountDTO>();
        for (AggregateResult ar : [
            SELECT Product__r.Name pName, COUNT(Id) cnt
            FROM Recommendation__c WHERE Product__c != null
            GROUP BY Product__r.Name ORDER BY COUNT(Id) DESC LIMIT 8
        ]) {
            ProductCountDTO p = new ProductCountDTO();
            p.productName = (String)ar.get('pName');
            p.recCount    = (Integer)ar.get('cnt');
            dto.topProducts.add(p);
        }

        // Top 8 customers by recommendation count
        dto.topCustomers = new List<CustomerCountDTO>();
        for (AggregateResult ar : [
            SELECT Customer__r.Name cName, COUNT(Id) cnt
            FROM Recommendation__c WHERE Customer__c != null
            GROUP BY Customer__r.Name ORDER BY COUNT(Id) DESC LIMIT 8
        ]) {
            CustomerCountDTO c = new CustomerCountDTO();
            c.customerName = (String)ar.get('cName');
            c.recCount     = (Integer)ar.get('cnt');
            dto.topCustomers.add(c);
        }

        // Category distribution
        dto.categoryData = new List<CategoryCountDTO>();
        for (AggregateResult ar : [
            SELECT Product__r.Category__c cat, COUNT(Id) cnt
            FROM Recommendation__c WHERE Product__r.Category__c != null
            GROUP BY Product__r.Category__c ORDER BY COUNT(Id) DESC LIMIT 8
        ]) {
            CategoryCountDTO cc = new CategoryCountDTO();
            cc.catName = (String)ar.get('cat');
            cc.cnt     = (Integer)ar.get('cnt');
            dto.categoryData.add(cc);
        }

        // Rating bands
        dto.ratingBands = new List<RatingBandDTO>();
        Map<String,Integer> bandMap = new Map<String,Integer>{
            '4.5–5.0'=>0,'4.0–4.5'=>0,'3.5–4.0'=>0,'3.0–3.5'=>0,'<3.0'=>0
        };
        for (Recommendation__c r : [SELECT Predicted_Rating__c FROM Recommendation__c WHERE Predicted_Rating__c != null]) {
            Decimal v = r.Predicted_Rating__c;
            if      (v >= 4.5) bandMap.put('4.5–5.0', bandMap.get('4.5–5.0') + 1);
            else if (v >= 4.0) bandMap.put('4.0–4.5', bandMap.get('4.0–4.5') + 1);
            else if (v >= 3.5) bandMap.put('3.5–4.0', bandMap.get('3.5–4.0') + 1);
            else if (v >= 3.0) bandMap.put('3.0–3.5', bandMap.get('3.0–3.5') + 1);
            else               bandMap.put('<3.0',    bandMap.get('<3.0')    + 1);
        }
        for (String key : new List<String>{'4.5–5.0','4.0–4.5','3.5–4.0','3.0–3.5','<3.0'}) {
            RatingBandDTO rb = new RatingBandDTO();
            rb.bandLabel = key;
            rb.cnt       = bandMap.get(key);
            dto.ratingBands.add(rb);
        }

        return dto;
    }

    public class AnalyticsDTO {
        @AuraEnabled public Integer              totalCustomers;
        @AuraEnabled public Integer              totalProducts;
        @AuraEnabled public Integer              totalRecs;
        @AuraEnabled public String               avgRating;
        @AuraEnabled public List<ProductCountDTO>  topProducts;
        @AuraEnabled public List<CustomerCountDTO> topCustomers;
        @AuraEnabled public List<CategoryCountDTO> categoryData;
        @AuraEnabled public List<RatingBandDTO>    ratingBands;
    }
    public class ProductCountDTO  { @AuraEnabled public String productName;  @AuraEnabled public Integer recCount; }
    public class CustomerCountDTO { @AuraEnabled public String customerName; @AuraEnabled public Integer recCount; }
    public class CategoryCountDTO { @AuraEnabled public String catName;      @AuraEnabled public Integer cnt; }
    public class RatingBandDTO    { @AuraEnabled public String bandLabel;    @AuraEnabled public Integer cnt; }

    // ── getHomeStats ──────────────────────────────────────────────────────
    // Called by recoHomePage — returns counts and avg rating
    @AuraEnabled(cacheable=true)
    public static HomeStatsDTO getHomeStats() {
        HomeStatsDTO dto = new HomeStatsDTO();
        dto.totalCustomers = [SELECT COUNT() FROM Customer__c];
        dto.totalProducts  = [SELECT COUNT() FROM Product__c];
        dto.totalRecs      = [SELECT COUNT() FROM Recommendation__c];

        List<AggregateResult> avgResult = [
            SELECT AVG(Predicted_Rating__c) avgR
            FROM Recommendation__c
            WHERE Predicted_Rating__c != null
        ];
        dto.avgRating = avgResult.isEmpty() || avgResult[0].get('avgR') == null
            ? '0.00'
            : ((Decimal)avgResult[0].get('avgR')).setScale(2).toPlainString();
        return dto;
    }

    public class HomeStatsDTO {
        @AuraEnabled public Integer totalCustomers;
        @AuraEnabled public Integer totalProducts;
        @AuraEnabled public Integer totalRecs;
        @AuraEnabled public String  avgRating;
    }

    // ── getRecentRecs ─────────────────────────────────────────────────────
    // Called by recoHomePage — returns latest 8 recommendations
    @AuraEnabled(cacheable=true)
    public static List<Recommendation__c> getRecentRecs() {
        return [
            SELECT Id, Name, Predicted_Rating__c,
                   Customer__c, Customer__r.Name,
                   Product__c,  Product__r.Name
            FROM Recommendation__c
            ORDER BY CreatedDate DESC
            LIMIT 8
        ];
    }

    // ── getAllCustomers ────────────────────────────────────────────────────
    @AuraEnabled(cacheable=true)
    public static List<CustomerListDTO> getAllCustomers() {
        List<Customer__c> customers = [
            SELECT Id, Name
            FROM Customer__c
            ORDER BY Name ASC
            LIMIT 500
        ];

        Map<Id,Integer> recCountMap = new Map<Id,Integer>();
        for (AggregateResult ar : [
            SELECT Customer__c custId, COUNT(Id) cnt
            FROM Recommendation__c
            GROUP BY Customer__c
        ]) {
            recCountMap.put((Id)ar.get('custId'), (Integer)ar.get('cnt'));
        }

        List<CustomerListDTO> result = new List<CustomerListDTO>();
        for (Customer__c c : customers) {
            CustomerListDTO dto         = new CustomerListDTO();
            dto.Id                      = c.Id;
            dto.Name                    = c.Name;
            dto.externalCustomerId      = '';
            dto.tier                    = '';
            dto.recCount                = recCountMap.containsKey(c.Id) ? recCountMap.get(c.Id) : 0;
            result.add(dto);
        }
        return result;
    }

    public class CustomerListDTO {
        @AuraEnabled public Id      Id;
        @AuraEnabled public String  Name;
        @AuraEnabled public String  externalCustomerId;
        @AuraEnabled public String  tier;
        @AuraEnabled public Integer recCount;
    }

    // ── getRecommendationDetails ──────────────────────────────────────────
    // Called by recDetailCard LWC — returns full recommendation with
    // Customer and Product relationship data
    @AuraEnabled(cacheable=true)
    public static Recommendation__c getRecommendationDetails(Id recId) {
        if (recId == null) {
            throw new AuraHandledException('recId is required.');
        }
        List<Recommendation__c> results = [
            SELECT
                Id, Name, Predicted_Rating__c,
                Customer__c, Customer__r.Name,
                Product__c,  Product__r.Name,
                Product__r.Category__c,
                Product__r.Product_ID__c
            FROM Recommendation__c
            WHERE Id = :recId
            LIMIT 1
        ];
        if (results.isEmpty()) {
            throw new AuraHandledException('Recommendation not found: ' + recId);
        }
        return results[0];
    }

    // ── getProductDetails ─────────────────────────────────────────────────
    @AuraEnabled(cacheable=true)
    public static Product__c getProductDetails(Id productId) {
        if (productId == null) {
            throw new AuraHandledException('productId is required.');
        }
        List<Product__c> results = [
            SELECT Id, Name, Product_ID__c, Category__c, Image_URL__c
            FROM Product__c
            WHERE Id = :productId
            LIMIT 1
        ];
        if (results.isEmpty()) {
            throw new AuraHandledException('Product not found: ' + productId);
        }
        return results[0];
    }

    // ── getProductStats ───────────────────────────────────────────────────
    // Primary method for productDetailCard LWC — full rating breakdown
    @AuraEnabled(cacheable=true)
    public static ProductStatsDTO getProductStats(Id productId) {
        if (productId == null) {
            throw new AuraHandledException('productId is required.');
        }
        List<Recommendation__c> recs = [
            SELECT Predicted_Rating__c, Customer__c, Customer__r.Name
            FROM Recommendation__c
            WHERE Product__c = :productId
            ORDER BY Predicted_Rating__c DESC NULLS LAST
            LIMIT 200
        ];

        ProductStatsDTO dto          = new ProductStatsDTO();
        dto.totalRecommendations     = recs.size();
        dto.avgRating                = 0;
        dto.topRating                = 0;
        dto.lowRating                = 0;
        dto.topCustomer              = '--';
        dto.ratingAbove4             = 0;
        dto.ratingAbove3             = 0;
        dto.confidence               = 0;
        dto.totalCount               = recs.size();
        dto.avgRatingStr             = '0.00';
        dto.highestRating            = '0.00';

        if (recs.isEmpty()) { return dto; }

        Decimal sum = 0;
        for (Recommendation__c r : recs) {
            sum += (r.Predicted_Rating__c != null ? r.Predicted_Rating__c : 0);
        }

        dto.avgRating    = (sum / recs.size()).setScale(2);
        dto.topRating    = (recs[0].Predicted_Rating__c != null
                            ? recs[0].Predicted_Rating__c : 0).setScale(2);
        dto.lowRating    = (recs[recs.size()-1].Predicted_Rating__c != null
                            ? recs[recs.size()-1].Predicted_Rating__c : 0).setScale(2);
        dto.topCustomer  = recs[0].Customer__r != null ? recs[0].Customer__r.Name : '--';
        dto.avgRatingStr = dto.avgRating.toPlainString();
        dto.highestRating= dto.topRating.toPlainString();

        Integer a4 = 0, a3 = 0;
        for (Recommendation__c r : recs) {
            Decimal v = r.Predicted_Rating__c != null ? r.Predicted_Rating__c : 0;
            if (v >= 4.0) a4++;
            if (v >= 3.0) a3++;
        }
        dto.ratingAbove4 = a4;
        dto.ratingAbove3 = a3;
        dto.confidence   = Integer.valueOf((dto.avgRating / 5) * 100);
        return dto;
    }

    // ── getProductRatings ─────────────────────────────────────────────────
    // Legacy method — kept so ProductDetailService.cls keeps compiling
    @AuraEnabled(cacheable=true)
    public static ProductStatsDTO getProductRatings(Id productId) {
        return getProductStats(productId);
    }

    // ── getProductRecommendStats ──────────────────────────────────────────
    // Legacy alias — kept so productRatingDisplay keeps compiling
    @AuraEnabled(cacheable=true)
    public static ProductStatsDTO getProductRecommendStats(Id productId) {
        return getProductStats(productId);
    }

    // ── ProductStatsDTO ───────────────────────────────────────────────────
    // Single DTO used by all product-related methods and LWCs.
    // Contains BOTH the new fields (productDetailCard) and old fields
    // (ProductDetailService, productRatingDisplay) so everything compiles.
    public class ProductStatsDTO {
        // ── New fields for productDetailCard ─────────────────────────────
        @AuraEnabled public Integer totalRecommendations;
        @AuraEnabled public Decimal avgRating;
        @AuraEnabled public Decimal topRating;
        @AuraEnabled public Decimal lowRating;
        @AuraEnabled public String  topCustomer;
        @AuraEnabled public Integer ratingAbove4;
        @AuraEnabled public Integer ratingAbove3;
        @AuraEnabled public Integer confidence;
        // ── Legacy fields for ProductDetailService / productRatingDisplay ─
        @AuraEnabled public Integer totalCount;
        @AuraEnabled public String  avgRatingStr;
        @AuraEnabled public String  highestRating;
    }
}