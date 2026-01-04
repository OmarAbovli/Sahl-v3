// AI Service for generating forecasts and insights
// This is a mock implementation - in production, you'd integrate with actual AI services

export interface ForecastData {
  period: string
  predicted_value: number
  confidence_interval: {
    lower: number
    upper: number
  }
  factors: string[]
}

export interface AIInsight {
  type: "trend" | "anomaly" | "recommendation" | "alert"
  category: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  recommendations?: string[]
}

export interface AnalysisResult {
  summary: string
  trends: Array<{
    metric: string
    direction: "up" | "down" | "stable"
    change_percentage: number
    significance: "low" | "medium" | "high"
  }>
  forecasts: ForecastData[]
  insights: AIInsight[]
  recommendations: string[]
}

class AIService {
  // Sales Forecasting
  async generateSalesForecast(salesData: any[], months = 3): Promise<AnalysisResult> {
    // Mock AI analysis - replace with actual AI service
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Calculate trends from historical data
    const recentSales = salesData.slice(-6) // Last 6 months
    const avgGrowth = this.calculateGrowthRate(recentSales)

    const forecasts: ForecastData[] = []
    let baseValue = recentSales[recentSales.length - 1]?.total || 10000

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(currentYear, currentMonth + i, 1)
      const seasonalFactor = this.getSeasonalFactor(futureDate.getMonth())
      const predictedValue = baseValue * (1 + avgGrowth) * seasonalFactor

      forecasts.push({
        period: futureDate.toISOString().slice(0, 7), // YYYY-MM format
        predicted_value: Math.round(predictedValue),
        confidence_interval: {
          lower: Math.round(predictedValue * 0.85),
          upper: Math.round(predictedValue * 1.15),
        },
        factors: ["historical_trend", "seasonal_adjustment", "market_conditions"],
      })

      baseValue = predictedValue
    }

    const insights: AIInsight[] = [
      {
        type: "trend",
        category: "sales",
        title: avgGrowth > 0 ? "Positive Sales Trend" : "Declining Sales Trend",
        description: `Sales are ${avgGrowth > 0 ? "growing" : "declining"} at an average rate of ${(avgGrowth * 100).toFixed(1)}% per month.`,
        severity: avgGrowth < -0.1 ? "high" : avgGrowth > 0.1 ? "low" : "medium",
        confidence: 0.78,
      },
    ]

    if (avgGrowth < -0.05) {
      insights.push({
        type: "alert",
        category: "sales",
        title: "Sales Decline Alert",
        description:
          "Sales have been declining for the past few months. Consider reviewing pricing strategy and marketing efforts.",
        severity: "high",
        confidence: 0.82,
        recommendations: [
          "Review pricing strategy",
          "Increase marketing efforts",
          "Analyze customer feedback",
          "Consider promotional campaigns",
        ],
      })
    }

    return {
      summary: `Based on ${recentSales.length} months of historical data, sales are ${avgGrowth > 0 ? "expected to grow" : "projected to decline"} over the next ${months} months.`,
      trends: [
        {
          metric: "Monthly Sales",
          direction: avgGrowth > 0 ? "up" : avgGrowth < 0 ? "down" : "stable",
          change_percentage: avgGrowth * 100,
          significance: Math.abs(avgGrowth) > 0.1 ? "high" : Math.abs(avgGrowth) > 0.05 ? "medium" : "low",
        },
      ],
      forecasts,
      insights,
      recommendations: this.generateSalesRecommendations(avgGrowth, recentSales),
    }
  }

  // Inventory Analysis
  async analyzeInventory(inventoryData: any[]): Promise<AnalysisResult> {
    const lowStockItems = inventoryData.filter((item) => item.quantity < 10)
    const overStockItems = inventoryData.filter((item) => item.quantity > 100)
    const totalValue = inventoryData.reduce((sum, item) => sum + item.quantity * (item.unit_price || 0), 0)

    const insights: AIInsight[] = []

    if (lowStockItems.length > 0) {
      insights.push({
        type: "alert",
        category: "inventory",
        title: "Low Stock Alert",
        description: `${lowStockItems.length} items are running low on stock and may need immediate restocking.`,
        severity: lowStockItems.length > 5 ? "high" : "medium",
        confidence: 0.95,
        recommendations: [
          "Review reorder points",
          "Contact suppliers for restocking",
          "Consider increasing safety stock levels",
        ],
      })
    }

    if (overStockItems.length > 0) {
      insights.push({
        type: "recommendation",
        category: "inventory",
        title: "Overstock Optimization",
        description: `${overStockItems.length} items have high stock levels. Consider promotional strategies to move inventory.`,
        severity: "medium",
        confidence: 0.73,
        recommendations: ["Run promotional campaigns", "Offer bulk discounts", "Review demand forecasting"],
      })
    }

    // Calculate inventory turnover prediction
    const avgTurnover = this.calculateInventoryTurnover(inventoryData)
    const forecasts: ForecastData[] = [
      {
        period: "Next Month",
        predicted_value: Math.round(totalValue * 0.9), // Assuming 10% turnover
        confidence_interval: {
          lower: Math.round(totalValue * 0.8),
          upper: Math.round(totalValue * 0.95),
        },
        factors: ["historical_turnover", "seasonal_demand", "current_stock_levels"],
      },
    ]

    return {
      summary: `Inventory analysis shows ${lowStockItems.length} low-stock items and ${overStockItems.length} overstocked items. Total inventory value: $${totalValue.toFixed(2)}.`,
      trends: [
        {
          metric: "Stock Levels",
          direction: lowStockItems.length > overStockItems.length ? "down" : "stable",
          change_percentage: ((lowStockItems.length - overStockItems.length) / inventoryData.length) * 100,
          significance: lowStockItems.length > 5 ? "high" : "medium",
        },
      ],
      forecasts,
      insights,
      recommendations: [
        "Implement automated reorder points",
        "Use demand forecasting for better planning",
        "Regular inventory audits",
        "Consider just-in-time inventory management",
      ],
    }
  }

  // Debt Collection Analysis
  async analyzeDebtCollection(debtsData: any[]): Promise<AnalysisResult> {
    const activeDebts = debtsData.filter((debt) => debt.status === "active" || debt.status === "overdue")
    const overdueDebts = debtsData.filter((debt) => debt.status === "overdue")
    const totalOutstanding = activeDebts.reduce((sum, debt) => sum + debt.remaining_amount, 0)
    const avgCollectionTime = this.calculateAverageCollectionTime(debtsData)

    const insights: AIInsight[] = []

    if (overdueDebts.length > 0) {
      const overdueAmount = overdueDebts.reduce((sum, debt) => sum + debt.remaining_amount, 0)
      insights.push({
        type: "alert",
        category: "debt",
        title: "Overdue Debt Alert",
        description: `$${overdueAmount.toFixed(2)} in overdue debts from ${overdueDebts.length} accounts requires immediate attention.`,
        severity: overdueAmount > 10000 ? "critical" : "high",
        confidence: 0.92,
        recommendations: [
          "Contact overdue accounts immediately",
          "Consider payment plans",
          "Review credit policies",
          "Implement automated reminders",
        ],
      })
    }

    // Predict collection probability
    const collectionProbability = this.predictCollectionProbability(activeDebts)
    const forecasts: ForecastData[] = [
      {
        period: "Next 30 Days",
        predicted_value: Math.round(totalOutstanding * collectionProbability),
        confidence_interval: {
          lower: Math.round(totalOutstanding * (collectionProbability - 0.1)),
          upper: Math.round(totalOutstanding * (collectionProbability + 0.1)),
        },
        factors: ["historical_collection_rate", "debt_age", "customer_payment_history"],
      },
    ]

    return {
      summary: `Total outstanding debt: $${totalOutstanding.toFixed(2)} across ${activeDebts.length} accounts. Average collection time: ${avgCollectionTime} days.`,
      trends: [
        {
          metric: "Collection Rate",
          direction: collectionProbability > 0.8 ? "up" : collectionProbability < 0.6 ? "down" : "stable",
          change_percentage: (collectionProbability - 0.75) * 100,
          significance: Math.abs(collectionProbability - 0.75) > 0.15 ? "high" : "medium",
        },
      ],
      forecasts,
      insights,
      recommendations: [
        "Implement early intervention strategies",
        "Offer early payment discounts",
        "Regular follow-up on outstanding accounts",
        "Consider factoring for large overdue amounts",
      ],
    }
  }

  // Helper methods
  private calculateGrowthRate(data: any[]): number {
    if (data.length < 2) return 0

    let totalGrowth = 0
    let validPeriods = 0

    for (let i = 1; i < data.length; i++) {
      const current = data[i].total || 0
      const previous = data[i - 1].total || 0

      if (previous > 0) {
        totalGrowth += (current - previous) / previous
        validPeriods++
      }
    }

    return validPeriods > 0 ? totalGrowth / validPeriods : 0
  }

  private getSeasonalFactor(month: number): number {
    // Simple seasonal adjustment - customize based on business
    const seasonalFactors = [0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 1.2, 1.2, 1.0, 1.0, 1.3, 1.4] // Dec is highest
    return seasonalFactors[month] || 1.0
  }

  private calculateInventoryTurnover(inventory: any[]): number {
    // Mock calculation - in reality, you'd need sales data
    return inventory.reduce((avg, item) => avg + (item.quantity > 0 ? 1 : 0), 0) / inventory.length
  }

  private calculateAverageCollectionTime(debts: any[]): number {
    const paidDebts = debts.filter((debt) => debt.status === "paid" && debt.last_payment_date)
    if (paidDebts.length === 0) return 30 // Default

    const totalDays = paidDebts.reduce((sum, debt) => {
      const saleDate = new Date(debt.sale_date)
      const paymentDate = new Date(debt.last_payment_date)
      const days = Math.floor((paymentDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)

    return Math.round(totalDays / paidDebts.length)
  }

  private predictCollectionProbability(debts: any[]): number {
    // Simple probability model based on debt age and amount
    let totalWeight = 0
    let weightedProbability = 0

    debts.forEach((debt) => {
      const daysSinceSale = Math.floor((Date.now() - new Date(debt.sale_date).getTime()) / (1000 * 60 * 60 * 24))
      const amount = debt.remaining_amount

      // Probability decreases with age and increases with smaller amounts
      let probability = Math.max(0.3, 1 - daysSinceSale / 365 - amount / 50000)
      probability = Math.min(0.95, probability)

      totalWeight += amount
      weightedProbability += probability * amount
    })

    return totalWeight > 0 ? weightedProbability / totalWeight : 0.75
  }

  private generateSalesRecommendations(growthRate: number, salesData: any[]): string[] {
    const recommendations = []

    if (growthRate < -0.05) {
      recommendations.push("Implement customer retention strategies")
      recommendations.push("Review and optimize pricing strategy")
      recommendations.push("Increase marketing and promotional activities")
    } else if (growthRate > 0.1) {
      recommendations.push("Scale up inventory to meet growing demand")
      recommendations.push("Consider expanding to new markets")
      recommendations.push("Invest in customer service improvements")
    } else {
      recommendations.push("Maintain current strategies while monitoring trends")
      recommendations.push("Focus on operational efficiency improvements")
    }

    recommendations.push("Regular performance monitoring and analysis")
    return recommendations
  }
}

export const aiService = new AIService()
