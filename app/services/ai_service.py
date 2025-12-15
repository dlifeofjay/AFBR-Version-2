import os
import json
from openai import OpenAI
from typing import Dict, Tuple, List
import pandas as pd
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in environment variables")
    return OpenAI(api_key=api_key)

async def map_columns_ai(headers: List[str]) -> Tuple[str, Dict]:
    prompt = f"""
    You are a Data Analyst. content: {', '.join(headers)}
    Return JSON mapping strictly:
    {{
    "order_id": "col_name_or_null",
    "date": "col_name_or_null",
    "revenue": "col_name_or_null",
    "quantity": "col_name_or_null",
    "product": "col_name_or_null",
    "customer": "col_name_or_null",
    "category": "col_name_or_null"
    }}
    """
    
    client = get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini", # Improved model if available, or fallback to 4.1-mini alias
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        response_format={ "type": "json_object" }
    )
    
    content = response.choices[0].message.content
    try:
        mapping = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(500, "Failed to parse AI mapping")
        
    return content, mapping

async def analyze_data_ai(df: pd.DataFrame, mapping: Dict) -> Dict:
    # Pre-calculate what we can to save tokens and ensure accuracy
    rev_col = mapping.get("revenue")
    qty_col = mapping.get("quantity")
    date_col = mapping.get("date")
    cat_col = mapping.get("category")
    
    if not rev_col or rev_col not in df.columns:
        raise HTTPException(400, "Revenue column missing")

    # --- Helper: Robust Numeric Cleaning ---
    def clean_numeric_series(series: pd.Series) -> pd.Series:
        # 1. Convert to string, lowercase, strip whitespace
        s = series.astype(str).str.lower().str.strip()
        
        # Handle 'null', 'nan', 'none' strings explicitly
        s = s.replace({'nan': '0', 'null': '0', 'none': '0', '': '0'})

        # 2. Handle Accounting Negatives: (123.45) -> -123.45
        # Check if starts with '(' and ends with ')'
        mask_parens = s.str.startswith('(') & s.str.endswith(')')
        # Remove parens and prepend '-' for those rows
        s.loc[mask_parens] = '-' + s.loc[mask_parens].str.strip('()')

        # 3. Remove common currency/text symbols ($, ,, %, space, letters)
        # We keep only digits, dots, minus signs.
        s = s.str.replace(r'[^\d.-]', '', regex=True)
        
        # 4. Handle multiple dots error (e.g. 1.2.3 -> NaN -> 0)
        # Convert to numeric, coercing errors to NaN, then fill 0
        return pd.to_numeric(s, errors='coerce').fillna(0)

    # --- Apply Cleaning ---
    df[rev_col] = clean_numeric_series(df[rev_col])
    if qty_col and qty_col in df.columns:
        df[qty_col] = clean_numeric_series(df[qty_col])

    total_revenue = float(df[rev_col].sum())
    total_qty = int(df[qty_col].sum()) if qty_col in df.columns else 0
    total_orders = len(df)
    
    # Prepare Data Summaries for AI (don't send whole file)
    
    # 1. Daily Trend (resample if possible)
    trend_data = []
    if date_col and date_col in df.columns:
        try:
            # Attempt to parse dates
            df['temp_date'] = pd.to_datetime(df[date_col], errors='coerce')
            daily = df.groupby(df['temp_date'].dt.strftime('%Y-%m-%d'))[rev_col].sum().reset_index()
            # Limit to last 30 entries to save context
            trend_data = daily.tail(30).to_dict('records')
        except Exception:
            pass

    # 2. Category Breakdown
    cat_data = []
    if cat_col and cat_col in df.columns:
        cat_group = df.groupby(cat_col)[rev_col].sum().sort_values(ascending=False).head(5)
        cat_data = [{"name": k, "value": v} for k, v in cat_group.items()]

    prompt = f"""
    Analyze e-commerce data. 
    Metrics: Rev ${total_revenue}, Qty {total_qty}, Orders {total_orders}.
    
    Trend (Last 30 pts): {json.dumps(trend_data)}
    Top Categories: {json.dumps(cat_data)}
    
    Return JSON:
    {{
        "summary": {{ 
            "total_orders": {total_orders}, 
            "total_revenue": {total_revenue}, 
            "total_items_sold": {total_qty} 
        }},
        "insights": ["3 distinct strategic insights"],
        "recommendations": ["3 actionable steps"],
        "sales_trend": [
            {{"name": "YYYY-MM-DD", "value": 123.45}} 
        ] (Limit to 20 points for chart),
        "category_breakdown": [
            {{"name": "CategoryName", "value": 1000}}
        ]
    }}
    """

    client = get_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        response_format={ "type": "json_object" }
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {
            "summary": {"total_orders": total_orders, "total_revenue": total_revenue, "total_items_sold": total_qty},
            "insights": ["Could not generate insights"],
            "recommendations": [],
            "sales_trend": [],
            "category_breakdown": []
        }
