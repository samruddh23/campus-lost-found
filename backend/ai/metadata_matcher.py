from datetime import datetime, timezone
import difflib

# Graceful import of rapidfuzz
try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

def calculate_text_similarity(text1, text2):
    """
    Computes a similarity score between 0.0 and 1.0 for two text strings.
    Uses rapidfuzz if available, falling back to standard library's difflib.
    """
    if not text1 or not text2:
        return 0.0
        
    t1 = str(text1).strip().lower()
    t2 = str(text2).strip().lower()
    
    if not t1 or not t2:
        return 0.0

    if HAS_RAPIDFUZZ:
        try:
            # fuzz.ratio returns a value in [0, 100]
            return float(fuzz.ratio(t1, t2)) / 100.0
        except Exception as e:
            print(f"rapidfuzz calculation error: {e}. Falling back to difflib.")
            
    # Fallback to standard library difflib
    try:
        return difflib.SequenceMatcher(None, t1, t2).ratio()
    except Exception as e:
        print(f"difflib similarity calculation error: {e}")
        return 0.0

def calculate_category_similarity(cat1, cat2):
    """
    Returns 1.0 if categories match exactly (case-insensitive), 0.0 otherwise.
    """
    if not cat1 or not cat2:
        return 0.0
    return 1.0 if str(cat1).strip().lower() == str(cat2).strip().lower() else 0.0

def calculate_date_similarity(date1, date2, max_days=30):
    """
    Computes a date proximity score between 0.0 and 1.0 using linear decay.
    max_days defines the window of decay (default 30 days).
    """
    if not date1 or not date2:
        return 1.0  # Fallback to neutral similarity when date metadata is missing
        
    try:
        # Standardize timezone-naive datetime comparisons
        d1 = date1.replace(tzinfo=None) if hasattr(date1, 'replace') else date1
        d2 = date2.replace(tzinfo=None) if hasattr(date2, 'replace') else date2
        
        delta_days = abs((d1 - d2).days)
        if delta_days >= max_days:
            return 0.0
        return 1.0 - (delta_days / max_days)
    except Exception as e:
        print(f"Error calculating date similarity: {e}")
        return 1.0
