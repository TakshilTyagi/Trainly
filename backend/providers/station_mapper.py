"""
station_mapper.py - Robust Upstream-to-Internal Station Resolver
Maps raw Indian Railways / NTES station codes and halt names to internal route stations.
Handles technical halts, missing intermediate stops, and naming variations.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger("trainly.station_mapper")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# Known station code aliases / alternate representations in CRIS / NTES
STATION_CODE_ALIASES = {
    "BSBS": "BSBS",
    "MUV": "BSBS",      # Old code for Manduadih (now Banaras BSBS)
    "VGLB": "VGLJ",     # Jhansi old code
    "JHS": "VGLJ",      # Jhansi historical code
    "NDLS": "NDLS",
    "DLI": "NDLS",
    "MMCT": "MMCT",
    "BCT": "MMCT",      # Bombay Central historical
    "MAS": "MAS",
    "BZA": "BZA",
    "NGP": "NGP",
    "ET": "ET",
    "LKO": "LKO",
    "BE": "BE",
    "MB": "MB",
    "HPU": "HPU",
    "MTC": "MTC",
    "AY": "AY",
    "AYC": "AY",       # Ayodhya Cantt / Dham alias
    "BSB": "BSB",
    "OGL": "OGL",
    "MS": "MS",
    "VM": "VM",
    "TPJ": "TPJ",
    "MNM": "MNM",
    "RMD": "RMD",
    "RMM": "RMM",
    "PCOI": "PCOI",
    "JBP": "JBP",
    "BPQ": "BPQ",
    "WL": "WL",
    "ST": "ST",
    "BRC": "BRC",
    "RTM": "RTM",
    "KOTA": "KOTA",
    "BVI": "BVI",
    # Kerala Express route stops
    "TVC": "TVC",
    "QLN": "QLN",
    "KTYM": "KTYM",
    "ERN": "ERN",
    "ERS": "ERN",       # Ernakulam Junction/Town interchange alias
    "TCR": "TCR",
    "PGT": "PGT",
    "CBE": "CBE",
    "ED": "ED",
    "SA": "SA",
    # Howrah Rajdhani route stops
    "HWH": "HWH",
    "ASN": "ASN",
    "DHN": "DHN",
    "PNME": "PNME",
    "GAYA": "GAYA",
    "DDU": "DDU",
    "MGS": "DDU",       # Old code for Mughal Sarai (now Pt. Deen Dayal Upadhyaya)
    "PRYJ": "PRYJ",
    "ALD": "PRYJ",      # Old code for Allahabad (now Prayagraj)
    "CNB": "CNB",
    # Bhopal Shatabdi route stops
    "MTJ": "MTJ",
    "AGC": "AGC",
    "GWL": "GWL",
    "LAR": "LAR",
    "BPL": "BPL",
    "RKMP": "RKMP",
    "HBJ": "RKMP",       # Old code for Habibganj (now Rani Kamlapati)
    # Additional expanded routes
    "HYB": "HYB",
    "SC": "SC",
    "KZJ": "KZJ",
    "RDM": "RDM",
    "MCI": "MCI",
    "BPA": "BPA",
    "SKZR": "SKZR",
    "CD": "CD",
    "KGP": "KGP",
    "BLS": "BLS",
    "BHC": "BHC",
    "CTC": "CTC",
    "BBS": "BBS",
    "KUR": "KUR",
    "BAM": "BAM",
    "PSA": "PSA",
    "CHE": "CHE",
    "VZM": "VZM",
    "VSKP": "VSKP",
    "SLO": "SLO",
    "RJY": "RJY",
    "NLR": "NLR",
    "GDR": "GDR",
    "SWM": "SWM",
    "GGC": "GGC",
    "NZM": "NZM",
    "SRE": "SRE",
    "UMB": "UMB",
    "LDH": "LDH",
    "JUC": "JUC",
    "BEAS": "BEAS",
    "ASR": "ASR",
    "CSMT": "CSMT",
    "CSTM": "CSMT",
    "VT": "CSMT",       # Historical Victoria Terminus
    "DR": "DR",
    "KYN": "KYN",
    "NK": "NK",
    "MMR": "MMR",
    "JL": "JL",
    "BSL": "BSL",
    "BAU": "BAU",
    "KNW": "KNW",
    "ROK": "ROK",
    "JIND": "JIND",
    "JHL": "JHL",
    "BTI": "BTI",
    "FZR": "FZR",
    "SVDK": "SVDK",
    "JAT": "JAT",
    "UHP": "UHP",
    "PNP": "PNP",
    "PURI": "PURI",
    "JJKR": "JJKR",
    "HIJ": "HIJ",
    "TATA": "TATA",
    "PRR": "PRR",
    "BKSC": "BKSC",
    "GMO": "GMO",
    "KQR": "KQR",
    "DOS": "DOS",
    "SSM": "SSM",
    "MZP": "MZP",
    "FTP": "FTP",
    "YPR": "YPR",
    "TK": "TK",
    "ASK": "ASK",
    "DVG": "DVG",
    "UBL": "UBL",
    "GDG": "GDG",
    "KBL": "KBL",
    "HPT": "HPT",
    "BAY": "BAY",
    "GTL": "GTL",
    "KRNT": "KRNT",
    "KCG": "KCG",
    "ADI": "ADI",
    "SBC": "SBC",
    "SSPN": "SSPN",
    "DMM": "DMM",
    "RC": "RC",
    "JSME": "JSME",
    "PNBE": "PNBE",
    "VAPI": "VAPI",
    "BH": "BH",
    "ANND": "ANND",
    "ND": "ND",
    "ALLP": "ALLP",
    "SRR": "SRR",
    "CLT": "CLT",
    "CAN": "CAN",
    "KGQ": "KGQ",
    "MAJN": "MAJN",
    "UD": "UD",
    "KAWR": "KAWR",
    "MAO": "MAO",
    "RN": "RN",
    "PNVL": "PNVL",
    "BSR": "BSR",
    "DBRG": "DBRG",
    "NTSK": "NTSK",
    "MXN": "MXN",
    "DMV": "DMV",
    "DPPH": "DPPH",
    "LMG": "LMG",
    "HJI": "HJI",
    "CPK": "CPK",
    "GHY": "GHY",
    "RNY": "RNY",
    "NBQ": "NBQ",
    "KOJ": "KOJ",
    "NOQ": "NOQ",
    "NCB": "NCB",
    "NJP": "NJP",
    "KNE": "KNE",
    "KIR": "KIR",
    "NNA": "NNA",
    "BGS": "BGS",
    "BJU": "BJU",
    "PPTA": "PPTA",
    "DNR": "DNR",
    "KMT": "KMT",
    "DEE": "DEE",
    "DEC": "DEC",
    "GGN": "GGN",
    "RE": "RE",
    "AWR": "AWR",
    "JP": "JP",
    "AII": "AII",
    "FA": "FA",
    "ABR": "ABR",
    "PNU": "PNU",
    "BDTS": "BDTS",
    "SDAH": "SDAH",
    "KPD": "KPD",
    "KJM": "KJM",
    "MYS": "MYS",
    "DGR": "DGR",
    "RNG": "RNG",
    "MURI": "MURI",
    "RNC": "RNC",
    "RU": "RU",
    "RJPB": "RJPB",
    "ARA": "ARA",
    "BXR": "BXR"
}

def normalize_station_name(name: str) -> str:
    """Normalizes station name by stripping common suffixes and casing."""
    n = name.strip().lower()
    for suffix in [" junction", " jn", " cantt", " central", " terminus", " city"]:
        n = n.replace(suffix, "")
    return n.strip()

def map_upstream_station_to_internal(
    train_no: str,
    raw_station_code: Optional[str],
    raw_station_name: Optional[str],
    internal_stations: List[Dict[str, Any]]
) -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
    """
    Maps an upstream NTES reported station to the corresponding index in internal_stations.
    Returns (index, station_dict) or (None, None) if not mapped.
    Logs both upstream identifier and internal match side by side.
    """
    if not raw_station_code and not raw_station_name:
        logger.info(f"[StationMapping] Train {train_no} | Upstream reported no station (e.g. not yet started)")
        return None, None

    code_candidate = (raw_station_code or "").strip().upper()
    canonical_code = STATION_CODE_ALIASES.get(code_candidate, code_candidate)

    # 1. Exact station code match
    for idx, stn in enumerate(internal_stations):
        internal_code = stn["code"].strip().upper()
        if internal_code == canonical_code or STATION_CODE_ALIASES.get(internal_code) == canonical_code:
            logger.info(
                f"[StationMapping] Train {train_no} | Code Match: Raw upstream '{raw_station_code}' ({raw_station_name}) "
                f"-> Internal '{stn['code']}' ({stn['name']}) at route index {idx}"
            )
            return idx, stn

    # 2. Normalized name match
    if raw_station_name:
        norm_raw = normalize_station_name(raw_station_name)
        for idx, stn in enumerate(internal_stations):
            norm_int = normalize_station_name(stn["name"])
            if norm_raw in norm_int or norm_int in norm_raw:
                logger.info(
                    f"[StationMapping] Train {train_no} | Name Match: Raw upstream '{raw_station_name}' (code: {raw_station_code}) "
                    f"-> Internal '{stn['name']}' ({stn['code']}) at route index {idx}"
                )
                return idx, stn

    logger.warning(
        f"[StationMapping] Train {train_no} | UNMAPPED Upstream Station: code='{raw_station_code}', name='{raw_station_name}'. "
        f"Searching for bounding section in internal route of {len(internal_stations)} stations."
    )
    return None, None
