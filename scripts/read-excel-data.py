#!/usr/bin/env python3

import json
import sys

try:
    import pandas as pd
    
    # Read the Excel file
    df = pd.read_excel('/Users/lech/PROJECT_lechworld/CIAS AEREAS E MILHAGEM FAMILIA LECH (1).xlsx')
    
    # Convert to JSON for easier processing
    data = df.to_dict('records')
    
    # Clean the data
    cleaned_data = []
    for row in data:
        cleaned_row = {}
        for key, value in row.items():
            # Handle NaN values
            if pd.isna(value):
                cleaned_row[key] = None
            else:
                cleaned_row[key] = value
        cleaned_data.append(cleaned_row)
    
    # Print as JSON
    print(json.dumps(cleaned_data, indent=2, default=str))
    
except ImportError:
    print("Error: pandas not installed")
    # Try reading with just standard library
    print("Please install pandas: pip install pandas openpyxl")
except Exception as e:
    print(f"Error reading Excel file: {str(e)}")