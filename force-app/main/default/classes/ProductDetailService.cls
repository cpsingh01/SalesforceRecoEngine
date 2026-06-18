/**
 * ProductDetailService
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrapper service for the productRatingDisplay LWC.
 * Delegates to RecommendationService so all logic stays in one place.
 * ─────────────────────────────────────────────────────────────────────────────
 */
public with sharing class ProductDetailService {

    @AuraEnabled(cacheable=true)
    public static RecommendationService.ProductStatsDTO getProductRecommendStats(
        Id productId
    ) {
        return RecommendationService.getProductStats(productId);
    }
}