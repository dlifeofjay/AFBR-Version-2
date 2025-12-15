from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class AnalysisSummary(BaseModel):
    total_orders: int
    total_revenue: float
    total_items_sold: int

class ChartDataPoint(BaseModel):
    name: str # Date or Category Name
    value: float
    secondary_value: Optional[float] = None # e.g. Quantity

class AnalysisContent(BaseModel):
    summary: AnalysisSummary
    insights: List[str]
    recommendations: List[str]
    sales_trend: Optional[List[ChartDataPoint]] = None
    category_breakdown: Optional[List[ChartDataPoint]] = None

class AnalysisResponse(BaseModel):
    report_id: str
    status: str
    column_mapping: Optional[Dict[str, Optional[str]]] = None
    analysis: Optional[AnalysisContent] = None # Relaxed validation for now, or use strict
    created_at: datetime
    filename: Optional[str] = None
