import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'HI' | 'TA' | 'TE' | 'ML';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'EN', label: 'English', nativeName: 'English' },
  { code: 'HI', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'TA', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'TE', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ML', label: 'Malayalam', nativeName: 'മലയാളം' },
];

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  EN: {
    app_name: 'Trainly',
    app_tagline: 'Real-time ETA, not static schedules. Live tracking and predictions for Indian Railways.',
    welcome_back: 'Welcome back',
    login_subtitle: 'Log in to track your trains.',
    email: 'Email',
    password: 'Password',
    forgot_password: 'Forgot password?',
    log_in: 'Log in',
    continue_as_guest: 'Continue as guest',
    new_here: 'New here?',
    create_account: 'Create an account',
    already_have_account: 'Already have an account? Log in',
    full_name: 'Full Name',
    sign_up: 'Sign Up',
    nav_tracker: 'Live Tracker',
    nav_fleet: 'Fleet Overview',
    nav_assistant: 'AI Assistant',
    nav_feedback: 'Delay Feedback',
    nav_safety: 'Safety & SOS',
    nav_control_room: 'Control Room',
    dashboard: 'Dashboard',
    on_time: 'On time',
    delayed: 'Delayed',
    why_this_eta: 'Why this ETA (ML Explainability)',
    journey_log: 'Live Journey Log',
    fleet_overview: 'Fleet Overview',
    sort_by_delay: 'Sort by delay',
    sort_by_train: 'Sort by train',
    updated_ago: 'Updated',
    currently_near: 'Currently near',
    next_stop: 'Next Stop',
    confidence: 'Confidence',
    ask_anything: 'Ask about any train, station, or line clearance',
    ask_placeholder: 'Ask about your train or a station...',
    quick_why_late: 'Why is my train late?',
    quick_nearest: 'Nearest station now',
    quick_best_time: 'Best time to leave for station',
    quick_vande_lucknow: 'Will Vande Bharat reach Lucknow on time?',
    quick_manduadih: 'Is Manduadih Express usually this delayed?',
    report_delay: 'Report Delay Cause (Human-in-the-Loop)',
    select_train: 'Select Train',
    delay_cause: 'Delay Cause Tag',
    optional_note: 'Optional note (e.g. Waiting at outer signal before junction)',
    submit_report: 'Submit Report',
    recent_reports: 'Recent Passenger Reports',
    for_passengers: '(For passengers)',
    agree: 'Agree',
    disagree: 'Disagree',
    confirmed_by: 'Confirmed by',
    others: 'passengers',
    confirm_action: 'Confirm',
    control_room_title: 'Operations Control Room',
    avg_fleet_delay: 'Avg Fleet Delay',
    on_time_count: 'On-Time Punctuality',
    active_alerts: 'Critical Alerts',
    avg_confidence: 'Mean ML Confidence',
    needs_attention: 'Requires Immediate Attention',
    fleet_status_table: 'Coaching Fleet Telemetry Table',
    top_delay_sections: 'Bottleneck Sections (Highest Delays)',
    recent_passenger_feedback: 'Live Passenger Delay Stream',
    api_access_panel: 'Open API for Control Rooms & External Apps',
    copy_endpoint: 'Copy Endpoint URL',
    copied: 'Copied to Clipboard!',
    edit_profile: 'Edit Profile',
    change_password: 'Change Password',
    log_out: 'Log Out',
    guest_notice: 'You are browsing as Guest. Log in to submit reports.',
    track_on_map: 'Track on Live Map',
    center_on_train: 'Center on Train',
    fit_route: 'Fit Route',
    speed: 'Speed',
    live_navigation: 'Live Navigation Mode',
    live_travel: 'Live Train Travel',
    pause_travel: 'Pause',
    play_travel: 'Resume',
    reset_travel: 'Reset',
    fog: 'Fog',
    signal: 'Signal Hold',
    congestion: 'Section Congestion',
    late_start: 'Late Departure',
    technical: 'Technical Issue',
    other: 'Other Cause',
    departed: 'Departed',
    en_route: 'En route to',
    predicted: 'Predicted',
    scheduled: 'Scheduled',
    yet_to_depart: 'Yet to Depart',
    not_departed_yet: 'Not departed yet',
    scheduled_departure: 'Scheduled Departure',
    journey_yet_to_start: 'Journey yet to start',
    train_not_departed_banner: 'Train has not departed yet',
    train_completed_banner: 'Train has reached its final destination',
    arrived: 'Arrived',
    arrived_at: 'Arrived at',
    journey_completed: 'Journey Completed',
    reached_final_station: 'Reached final destination',
    origin: 'Origin',
    current: 'Current Location',
    destination: 'Destination',
    issue: 'Issue',
    passenger_report: 'Passenger Report',
    no_passenger_reports: 'No passenger reports yet',
    confidence_interval: '80% prediction interval',
    dispatch_bottlenecks: 'Dispatch & Section Bottlenecks',
    live_telemetry_connected: 'Live Telemetry Stream Connected',
    across_monitored_corridors: 'across 4 monitored corridors',
    punctuality_index: 'punctuality index',
    requires_section_review: 'requires section review',
    inspect_telemetry: 'Inspect Route Telemetry',
    train_col: 'Train',
    route_col: 'Route',
    current_near_col: 'Current Near',
    next_stop_eta_col: 'Next Stop & ETA',
    delay_status_col: 'Delay Status',
    action_col: 'Action',
    track_btn: 'Track',
    avg: 'avg',
    congestion_label: 'congestion',
    optional_note_placeholder: 'e.g. Standing at outer approach signal before junction',
    live_passenger_delay_stream: 'Live Passenger Delay Stream',
    reports_count: 'reports',
    by: 'by',
    confirmed: 'confirmed',
    just_now: 'just now',
    m_ago: 'm ago',
    h_ago: 'h ago',
    highest_delay_corridor: 'Highest delay corridor',
    currently_between: 'Currently between',
    and: 'and',
    built_by_innobharat: 'BUILT BY INNOBHARAT',
    live_active_trains: 'Live Active Trains',
    fleet_subtitle: 'Multi-corridor active tracking & dynamic delay forecasts',
    live_ntes_telemetry_badge: 'Live NTES Telemetry & AI Quantile Forecasting',
    connecting_ntes: 'Connecting to Live NTES Telemetry...',
    live_gps_speed: 'Live GPS Speed',
    scroll_to_trace: 'Scroll to trace path ↕',
    stations_count: 'stations',
    seconds_short: 's ago',
    delay_subtitle: 'Select the active delay factor to supply instant ground-truth telemetry to neural models.',
    submitted_success: 'Submitted to Real-time Model!',
    submitting: 'Submitting...',
    no_reports_yet: 'No passenger reports yet for this train. Be the first to report above!',
    severe_delay: 'Severe Delay',
    section_delay_hold: 'Section Delay Hold',
    low_confidence: 'Low Prediction Confidence',
    search_train: 'Search train by name or number...',
    search_fleet: 'Search fleet by train, station or route...',
    filter_label: 'Filter',
    filter_all: 'All Trains',
    filter_on_time: 'On Time',
    filter_delayed: 'Delayed',
    filter_not_departed: 'Not Departed Yet',
    filter_arrived: 'Arrived',
    clear_filters: 'Clear filters',
    no_filter_matches: 'No trains match the selected filter and search criteria.',
      leave_home_by: 'Leave Home By',
    drive_time: 'Drive Time',
    buffer_time: 'Buffer',
    departure_time: 'Departure',
    traffic_condition: 'Traffic',
    traffic_light: 'Light',
    traffic_moderate: 'Moderate',
    traffic_heavy: 'Heavy',
    calculating: 'Calculating...',
    enable_location_prompt: 'Enable location to see when to leave.',
    safety_subtitle: 'An extension of RPF\'s Meri Saheli / Operation Mahila Suraksha',
    sos_hold_prompt: 'Press and hold for 2 seconds to activate.',
    sos_alert_sent: 'Alert Sent Successfully',
    min_unit: 'min',
    ist_unit: 'IST',
    sos_hold_subtext: 'Alerts RPF, TT, and nearby users.',
    sos_alert_desc_prefix: 'Alert routed to RPF control room,',
    sos_alert_desc_suffix: 'and nearby Trainly users.',
    cancel_undo: 'Cancel / Undo',
    auto_detection: 'Auto-Detection',
    locating_train: 'Locating your train...',
    match_found: 'Match Found',
    matched_via_gps: 'Matched via live GPS telemetry correlation.',
    couldnt_detect_train: 'Couldn\'t detect your train automatically.',
    loc_denied_help: 'Location permissions denied. You can still use the SOS and helpline buttons below.',
    no_train_nearby_help: 'No tracked train nearby. You can still use the SOS and helpline buttons below.',
    tte_title: 'Train Ticket Examiner (TT)',
    coach_label: 'Coach',
    illustrative_data: '*Illustrative directory data',
    next_station_rpf: 'Next Station RPF Post',
    rpf_post: 'RPF Post',
    eta_label: 'ETA',
    contact_not_avail: 'Contact not available — use 182 for immediate assistance.',
    quick_dial_helplines: 'Quick-Dial Helplines (Verified)',
    rpf_womens_security: 'RPF Women\'s Security',
    grp_helpline: 'GRP Helpline State Police',
    railmadad_enquiry: 'RailMadad General Enquiry',
    nearest_station: 'Nearest Station',
    change_station: 'Change',
    no_nearby_station: 'Couldn\'t determine a nearby station on this route',
    select_boarding_station: 'Select Boarding Station',
    auto_matched: 'Auto-matched',
    search_station: 'Search station...',
    no_stations_found: 'No stations found',
},
  HI: {
    app_name: 'ट्रेनली',
    app_tagline: 'वास्तविक समय ईटीए, कोई स्थिर समय सारिणी नहीं। भारतीय रेल के लिए लाइव ट्रैकिंग और भविष्यवाणियां।',
    welcome_back: 'स्वागत है',
    login_subtitle: 'अपनी ट्रेन ट्रैक करने के लिए लॉग इन करें।',
    email: 'ईमेल पता',
    password: 'पासवर्ड',
    forgot_password: 'पासवर्ड भूल गए?',
    log_in: 'लॉग इन करें',
    continue_as_guest: 'अतिथि के रूप में जारी रखें',
    new_here: 'नए उपयोगकर्ता हैं?',
    create_account: 'नया खाता बनाएं',
    already_have_account: 'पहले से खाता है? लॉग इन करें',
    full_name: 'पूरा नाम',
    sign_up: 'खाता बनाएं',
    nav_tracker: 'लाइव ट्रैकर',
    nav_fleet: 'फ्लीट स्थिति',
    nav_assistant: 'एआई सहायक',
    nav_feedback: 'देरी रिपोर्ट',
    nav_safety: 'सुरक्षा एवं एसओएस',
    nav_control_room: 'कंट्रोल रूम',
    dashboard: 'डैशबोर्ड',
    on_time: 'समय पर',
    delayed: 'देरी से',
    why_this_eta: 'यह ईटीए क्यों? (एमएल व्याख्या)',
    journey_log: 'लाइव यात्रा विवरण',
    fleet_overview: 'ट्रेनों का अवलोकन',
    sort_by_delay: 'देरी अनुसार क्रमबद्ध करें',
    sort_by_train: 'ट्रेन नंबर अनुसार क्रमबद्ध करें',
    updated_ago: 'अपडेट किया गया',
    currently_near: 'वर्तमान में निकट',
    next_stop: 'अगला स्टेशन',
    confidence: 'विश्वसनीयता',
    ask_anything: 'किसी भी ट्रेन, स्टेशन या लाइन क्लियरेंस के बारे में पूछें',
    ask_placeholder: 'अपनी ट्रेन या स्टेशन के बारे में पूछें...',
    quick_why_late: 'मेरी ट्रेन में देरी क्यों है?',
    quick_nearest: 'अभी निकटतम स्टेशन',
    quick_best_time: 'स्टेशन के लिए निकलने का सही समय',
    quick_vande_lucknow: 'क्या वंदे भारत समय पर लखनऊ पहुंचेगी?',
    quick_manduadih: 'क्या मडुवाडीह एक्सप्रेस में आमतौर पर इतनी देरी होती है?',
    report_delay: 'देरी का कारण बताएं (यात्री फीडबैक)',
    select_train: 'ट्रेन का चयन करें',
    delay_cause: 'देरी का कारण टैग',
    optional_note: 'वैकल्पिक टिप्पणी (उदा. आउटर सिग्नल पर रुकी है)',
    submit_report: 'रिपोर्ट दर्ज करें',
    recent_reports: 'हालिया यात्री रिपोर्टें',
    for_passengers: '(यात्रियों के लिए)',
    agree: 'सहमत',
    disagree: 'असहमत',
    confirmed_by: 'द्वारा सत्यापित',
    others: 'यात्री',
    confirm_action: 'सत्यापित करें',
    control_room_title: 'परिचालन कंट्रोल रूम',
    avg_fleet_delay: 'औसत फ्लीट देरी',
    on_time_count: 'समय पर चलने की दर',
    active_alerts: 'महत्वपूर्ण अलर्ट',
    avg_confidence: 'औसत एमएल विश्वसनीयता',
    needs_attention: 'तत्काल ध्यान देने योग्य',
    fleet_status_table: 'फ्लीट टेलीमेट्री विवरण',
    top_delay_sections: 'सर्वाधिक देरी वाले रेल खंड',
    recent_passenger_feedback: 'लाइव यात्री प्रतिक्रिया स्ट्रीम',
    api_access_panel: 'कंट्रोल रूम और ऐप्स के लिए ओपन एपीआई',
    copy_endpoint: 'एपीआई यूआरएल कॉपी करें',
    copied: 'कॉपी कर लिया गया!',
    edit_profile: 'प्रोफ़ाइल संपादित करें',
    change_password: 'पासवर्ड बदलें',
    log_out: 'लॉग आउट',
    guest_notice: 'आप अतिथि के रूप में देख रहे हैं। रिपोर्ट करने के लिए लॉग इन करें।',
    track_on_map: 'लाइव मैप पर देखें',
    center_on_train: 'ट्रेन पर केंद्रित करें',
    fit_route: 'पूरा रूट दिखाएं',
    speed: 'गति',
    live_navigation: 'लाइव नेविगेशन मोड',
    live_travel: 'लाइव ट्रेन आवागमन',
    pause_travel: 'रोकें',
    play_travel: 'जारी रखें',
    reset_travel: 'पुनः आरंभ करें',
    fog: 'कोहरा',
    signal: 'सिग्नल होल्ड',
    congestion: 'लाइन पर भारी भीड़',
    late_start: 'प्रारंभिक स्टेशन से देरी',
    technical: 'तकनीकी खराबी',
    other: 'अन्य कारण',
    departed: 'प्रस्थान कर चुकी',
    en_route: 'मार्ग में',
    predicted: 'अनुमानित समय',
    scheduled: 'निर्धारित',
    yet_to_depart: 'रवाना होना बाकी',
    not_departed_yet: 'अभी रवाना नहीं हुई',
    scheduled_departure: 'निर्धारित प्रस्थान',
    journey_yet_to_start: 'यात्रा अभी शुरू नहीं हुई',
    train_not_departed_banner: 'ट्रेन अभी रवाना नहीं हुई है',
    train_completed_banner: 'ट्रेन अपने अंतिम स्टेशन पर पहुँच चुकी है',
    arrived: 'पहुँच गई',
    arrived_at: 'पहुँचने का समय',
    journey_completed: 'यात्रा पूर्ण',
    reached_final_station: 'अंतिम स्टेशन पर पहुँची',
    origin: 'आरंभिक स्टेशन',
    current: 'वर्तमान स्थिति',
    destination: 'गंतव्य',
    issue: 'समस्या',
    passenger_report: 'यात्री रिपोर्ट',
    no_passenger_reports: 'अभी कोई यात्री रिपोर्ट नहीं है',
    confidence_interval: '80% पूर्वानुमान अंतराल',
    dispatch_bottlenecks: 'डिस्पैच और सेक्शन बॉटलनेक',
    live_telemetry_connected: 'लाइव टेलीमेट्री स्ट्रीम कनेक्टेड',
    across_monitored_corridors: '4 निगरानी वाले कॉरिडोर में',
    punctuality_index: 'समयपालन सूचकांक',
    requires_section_review: 'सेक्शन समीक्षा आवश्यक',
    inspect_telemetry: 'रूट टेलीमेट्री निरीक्षण करें',
    train_col: 'ट्रेन',
    route_col: 'मार्ग',
    current_near_col: 'वर्तमान में निकट',
    next_stop_eta_col: 'अगला ठहराव और ईटीए',
    delay_status_col: 'विलंब स्थिति',
    action_col: 'कार्रवाई',
    track_btn: 'ट्रैक करें',
    avg: 'औसत',
    congestion_label: 'कंजेशन (भीड़)',
    optional_note_placeholder: 'उदा. जंक्शन से पहले आउटर अप्रोच सिग्नल पर रुकी हुई है',
    live_passenger_delay_stream: 'लाइव यात्री विलंब स्ट्रीम',
    reports_count: 'रिपोर्ट',
    by: 'द्वारा',
    confirmed: 'पुष्टीकृत',
    just_now: 'अभी-अभी',
    m_ago: 'मिनट पहले',
    h_ago: 'घंटे पहले',
    highest_delay_corridor: 'सर्वाधिक विलंब वाला कॉरिडोर',
    currently_between: 'वर्तमान में बीच में',
    and: 'और',
    built_by_innobharat: 'इनोभारत द्वारा निर्मित',
    live_active_trains: 'लाइव सक्रिय ट्रेनें',
    fleet_subtitle: 'मल्टी-कॉरिडोर सक्रिय ट्रैकिंग और गतिशील विलंब पूर्वानुमान',
    live_ntes_telemetry_badge: 'लाइव एनटीईएस टेलीमेट्री और एआई क्वांटाइल पूर्वानुमान',
    connecting_ntes: 'लाइव एनटीईएस टेलीमेट्री से कनेक्ट हो रहा है...',
    live_gps_speed: 'लाइव जीपीएस गति',
    scroll_to_trace: 'मार्ग देखने के लिए स्क्रॉल करें ↕',
    stations_count: 'स्टेशन',
    seconds_short: 'सेकंड पहले',
    delay_subtitle: 'न्यूरल मॉडल को सटीक जानकारी प्रदान करने के लिए वर्तमान देरी का कारण चुनें।',
    submitted_success: 'रीयल-टाइम मॉडल में सफलतापूर्वक दर्ज!',
    submitting: 'दर्ज किया जा रहा है...',
    no_reports_yet: 'इस ट्रेन के लिए अभी कोई यात्री रिपोर्ट नहीं है। ऊपर सबसे पहले रिपोर्ट करें!',
    severe_delay: 'गंभीर विलंब',
    section_delay_hold: 'सेक्शन विलंब ठहराव',
    low_confidence: 'कम पूर्वानुमान विश्वसनीयता',
    search_train: 'ट्रेन का नाम या नंबर खोजें...',
    search_fleet: 'ट्रेन, स्टेशन या रूट से खोजें...',
    filter_label: 'फ़िल्टर',
    filter_all: 'सभी ट्रेनें',
    filter_on_time: 'समय पर',
    filter_delayed: 'विलंबित',
    filter_not_departed: 'अभी प्रस्थान नहीं हुई',
    filter_arrived: 'पहुंच गई',
    clear_filters: 'फ़िल्टर हटाएं',
    no_filter_matches: 'चयनित फ़िल्टर और खोज के अनुसार कोई ट्रेन नहीं मिली।',
      leave_home_by: 'घर से निकलने का समय',
    drive_time: 'ड्राइव का समय',
    buffer_time: 'बफ़र',
    departure_time: 'प्रस्थान',
    traffic_condition: 'यातायात',
    traffic_light: 'सुगम',
    traffic_moderate: 'मध्यम',
    traffic_heavy: 'भारी',
    calculating: 'गणना हो रही है...',
    enable_location_prompt: 'घर से निकलने का समय देखने के लिए लोकेशन चालू करें।',
    safety_subtitle: 'आरपीएफ की "मेरी सहेली" / ऑपरेशन महिला सुरक्षा की एक पहल',
    sos_hold_prompt: 'सक्रिय करने के लिए 2 सेकंड दबाकर रखें।',
    sos_alert_sent: 'अलर्ट सफलतापूर्वक भेजा गया',
    min_unit: 'मिनट',
    ist_unit: 'IST',
    sos_hold_subtext: 'आरपीएफ, टीटी और आस-पास के यात्रियों को सूचित करता है।',
    sos_alert_desc_prefix: 'अलर्ट आरपीएफ नियंत्रण कक्ष को भेजा गया,',
    sos_alert_desc_suffix: 'और आस-पास के ट्रेनली उपयोगकर्ताओं को।',
    cancel_undo: 'रद्द करें / वापस लें',
    auto_detection: 'स्वचालित पहचान',
    locating_train: 'आपकी ट्रेन का पता लगाया जा रहा है...',
    match_found: 'ट्रेन की पुष्टि हुई',
    matched_via_gps: 'लाइव जीपीएस टेलीमेट्री मिलान द्वारा पहचाना गया।',
    couldnt_detect_train: 'ट्रेन का स्वचालित रूप से पता नहीं चल सका।',
    loc_denied_help: 'लोकेशन अनुमति अस्वीकृत है। आप नीचे दिए गए एसओएस और हेल्पलाइन बटन का उपयोग कर सकते हैं।',
    no_train_nearby_help: 'पास में कोई ट्रैक की गई ट्रेन नहीं है। आप नीचे दिए गए एसओएस और हेल्पलाइन बटन का उपयोग कर सकते हैं।',
    tte_title: 'ट्रेन टिकट परीक्षक (टीटी)',
    coach_label: 'कोच',
    illustrative_data: '*उदाहरणात्मक निर्देशिका डेटा',
    next_station_rpf: 'अगले स्टेशन की आरपीएफ चौकी',
    rpf_post: 'आरपीएफ चौकी',
    eta_label: 'आगमन समय',
    contact_not_avail: 'संपर्क उपलब्ध नहीं है — तत्काल सहायता के लिए 182 डायल करें।',
    quick_dial_helplines: 'त्वरित हेल्पलाइन नंबर (सत्यापित)',
    rpf_womens_security: 'आरपीएफ महिला सुरक्षा',
    grp_helpline: 'जीआरपी हेल्पलाइन राजकीय पुलिस',
    railmadad_enquiry: 'रेल मदद सामान्य पूछताछ',
    nearest_station: 'निकटतम स्टेशन',
    change_station: 'बदलें',
    no_nearby_station: 'इस मार्ग पर कोई नजदीकी स्टेशन नहीं मिला',
    select_boarding_station: 'बोर्डिंग स्टेशन चुनें',
    auto_matched: 'स्वचालित चयनित',
    search_station: 'स्टेशन खोजें...',
    no_stations_found: 'कोई स्टेशन नहीं मिला',
},
  TA: {
    app_name: 'ரயில்லி',
    app_tagline: 'நிகழ்நேர வருகை நேரம், நிலையான அட்டவணை அல்ல. இந்திய ரயில்வே நேரடி கணிப்பு.',
    welcome_back: 'மீண்டும் வருக',
    login_subtitle: 'ரயில்களை கண்காணிக்க உள்நுழைக.',
    email: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    forgot_password: 'கடவுச்சொல் மறந்துவிட்டதா?',
    log_in: 'உள்நுழையவும்',
    continue_as_guest: 'விருந்தினராக தொடரவும்',
    new_here: 'புதியவரா?',
    create_account: 'புதிய கணக்கை உருவாக்கவும்',
    already_have_account: 'ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்',
    full_name: 'முழு பெயர்',
    sign_up: 'பதிவு செய்க',
    nav_tracker: 'நேரடி டிராக்கர்',
    nav_fleet: 'ரயில் நிலைமை',
    nav_assistant: 'ஏஐ உதவியாளர்',
    nav_feedback: 'தாமத அறிக்கை',
    nav_safety: 'பாதுகாப்பு & SOS',
    nav_control_room: 'கட்டுப்பாட்டு அறை',
    dashboard: 'டாஷ்போர்டு',
    on_time: 'நேரத்திற்கு',
    delayed: 'தாமதமாகிறது',
    why_this_eta: 'இந்த வருகை நேரம் ஏன்? (ML விளக்கம்)',
    journey_log: 'நேரடி பயண பதிவு',
    fleet_overview: 'அனைத்து ரயில்கள் நிலை',
    sort_by_delay: 'தாமதப்படி வரிசைப்படுத்து',
    sort_by_train: 'ரயில் எண் படி வரிசைப்படுத்து',
    updated_ago: 'புதுப்பிக்கப்பட்டது',
    currently_near: 'தற்போது அருகில்',
    next_stop: 'அடுத்த நிறுத்தம்',
    confidence: 'நம்பகத்தன்மை',
    ask_anything: 'ரயில், நிலையம் அல்லது பாதை அனுமதி பற்றி கேளுங்கள்',
    ask_placeholder: 'உங்கள் ரயில் அல்லது நிலையம் பற்றி கேளுங்கள்...',
    quick_why_late: 'என் ரயில் ஏன் தாமதமாகிறது?',
    quick_nearest: 'அருகிலுள்ள நிலையம்',
    quick_best_time: 'நிலையம் செல்ல சிறந்த நேரம்',
    quick_vande_lucknow: 'வந்தே பாரத் லக்னோவை சரியான நேரத்தில் அடையுமா?',
    quick_manduadih: 'மண்டுவாடி எக்ஸ்பிரஸ் பொதுவாக இவ்வளவு தாமதமாகிறதா?',
    report_delay: 'தாமத காரணத்தை தெரிவிக்கவும்',
    select_train: 'ரயிலை தேர்ந்தெடுக்கவும்',
    delay_cause: 'தாமத காரணம்',
    optional_note: 'குறிப்பு (எ.கா. சிக்னலில் காத்திருக்கிறது)',
    submit_report: 'அறிக்கையை சமர்ப்பிக்கவும்',
    recent_reports: 'சமீபத்திய பயணிகள் அறிக்கைகள்',
    for_passengers: '(பயணிகளுக்கு)',
    agree: 'ஒப்புக்கொள்கிறேன்',
    disagree: 'மறுக்கிறேன்',
    confirmed_by: 'உறுதிப்படுத்தியவர்கள்',
    others: 'பயணிகள்',
    confirm_action: 'உறுதிப்படுத்து',
    control_room_title: 'செயல்பாட்டு கட்டுப்பாட்டு அறை',
    avg_fleet_delay: 'சராசரி தாமத நேரம்',
    on_time_count: 'நேரத்திற்கு செல்லும் விகிதம்',
    active_alerts: 'முக்கிய எச்சரிக்கைகள்',
    avg_confidence: 'சராசரி ML நம்பகத்தன்மை',
    needs_attention: 'கவனிக்கப்பட வேண்டியவை',
    fleet_status_table: 'ரயில் தொலை அளவியல் அட்டவணை',
    top_delay_sections: 'அதிக தாமதமடையும் பிரிவுகள்',
    recent_passenger_feedback: 'பயணிகள் தாமத தகவல் ஓட்டம்',
    api_access_panel: 'கட்டுப்பாட்டு அறைக்கான திறந்த API',
    copy_endpoint: 'API முகவரியை நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',
    edit_profile: 'சுயவிவரத்தை திருத்து',
    change_password: 'கடவுச்சொல்லை மாற்று',
    log_out: 'வெளியேறு',
    guest_notice: 'விருந்தினர் முறைமையில் உள்ளீர்கள். அறிக்கை சமர்ப்பிக்க உள்நுழைக.',
    track_on_map: 'வரைபடத்தில் பார்க்க',
    center_on_train: 'ரயிலை மையப்படுத்து',
    fit_route: 'முழு வழியைக் காட்டு',
    speed: 'வேகம்',
    live_navigation: 'நேரடி வழிகாட்டல் முறைமை',
    fog: 'பனிமூட்டம்',
    signal: 'சிக்னல் தாமதம்',
    congestion: 'பாதை நெரிசல்',
    late_start: 'தாமதமான புறப்பாடு',
    technical: 'தொழில்நுட்ப சிக்கல்',
    other: 'மற்ற காரணங்கள்',
    departed: 'புறப்பட்டது',
    en_route: 'செல்லும் வழியில்',
    predicted: 'கணிக்கப்பட்ட நேரம்',
    scheduled: 'திட்டமிடப்பட்டது',
    yet_to_depart: 'புறப்பட வேண்டியுள்ளது',
    not_departed_yet: 'இன்னும் புறப்படவில்லை',
    scheduled_departure: 'திட்டமிடப்பட்ட புறப்பாடு',
    journey_yet_to_start: 'பயணம் இன்னும் தொடங்கவில்லை',
    train_not_departed_banner: 'ரயில் இன்னும் புறப்படவில்லை',
    train_completed_banner: 'ரயில் அதன் இறுதி நிலையத்தை அடைந்துவிட்டது',
    arrived: 'அடைந்தது',
    arrived_at: 'வந்தடைந்தது',
    journey_completed: 'பயணம் முடிந்தது',
    reached_final_station: 'இறுதி நிலையத்தை அடைந்தது',
    origin: 'தொடக்க நிலையம்',
    current: 'தற்போதைய இடம்',
    destination: 'சேரும் இடம்',
    issue: 'பிரச்சனை',
    passenger_report: 'பயணிகள் அறிக்கை',
    no_passenger_reports: 'இதுவரை பயணிகள் அறிக்கை எதுவும் இல்லை',
    confidence_interval: '80% கணிப்பு இடைவெளி',
    dispatch_bottlenecks: 'பணிப்பகிர்வு மற்றும் பிரிவு நெரிசல்கள்',
    live_telemetry_connected: 'நேரலை டெலிமெட்ரி ஸ்ட்ரீம் இணைக்கப்பட்டுள்ளது',
    across_monitored_corridors: '4 கண்காணிக்கப்படும் வழித்தடங்களில்',
    punctuality_index: 'சரியான நேரக் குறியீடு',
    requires_section_review: 'பிரிவு மறுஆய்வு தேவை',
    inspect_telemetry: 'பாதை டெலிமெட்ரியை ஆய்வு செய்க',
    train_col: 'ரயில்',
    route_col: 'வழித்தடம்',
    current_near_col: 'தற்போது அருகில்',
    next_stop_eta_col: 'அடுத்த நிறுத்தம் & வருகை நேரம்',
    delay_status_col: 'தாமத நிலை',
    action_col: 'செயல்',
    track_btn: 'கண்காணிக்கவும்',
    avg: 'சராசரி',
    congestion_label: 'நெரிசல்',
    optional_note_placeholder: 'எ.கா. சந்திப்புக்கு முன் வெளிப்புற அணுகுமுறை சிக்னலில் நிற்கிறது',
    live_passenger_delay_stream: 'நேரலை பயணிகள் தாமத ஸ்ட்ரீம்',
    reports_count: 'அறிக்கைகள்',
    by: 'மூலம்',
    confirmed: 'உறுதிப்படுத்தப்பட்டது',
    just_now: 'இப்போதுதான்',
    m_ago: 'நிமிடம் முன்',
    h_ago: 'மணிநேரம் முன்',
    highest_delay_corridor: 'அதிக தாமத வழித்தடம்',
    currently_between: 'தற்போது இடையே',
    and: 'மற்றும்',
    built_by_innobharat: 'இன்னோபாரத் மூலம் உருவாக்கப்பட்டது',
    live_active_trains: 'செயலில் உள்ள ரயில்கள்',
    fleet_subtitle: 'பல வழித்தட நேரடி கண்காணிப்பு மற்றும் தாமத முன்னறிவிப்புகள்',
    live_ntes_telemetry_badge: 'நேரலை NTES தொலைத்தொடர்பு & AI முன்னறிவிப்பு',
    connecting_ntes: 'நேரலை NTES டெலிமெட்ரியுடன் இணைகிறது...',
    live_gps_speed: 'நேரலை ஜிபிஎஸ் வேகம்',
    scroll_to_trace: 'பாதையைக் காண உருட்டவும் ↕',
    stations_count: 'நிலையங்கள்',
    seconds_short: 'விநாடிகளுக்கு முன்',
    delay_subtitle: 'நியூரல் மாடல்களுக்கு உடனடி தகவலை வழங்க செயலில் உள்ள தாமத காரணியைத் தேர்ந்தெடுக்கவும்.',
    submitted_success: 'நிகழ்நேர மாதிரியில் சமர்ப்பிக்கப்பட்டது!',
    submitting: 'சமர்ப்பிக்கப்படுகிறது...',
    no_reports_yet: 'இந்த ரயிலுக்கு இன்னும் பயணிகள் அறிக்கை இல்லை. மேலே முதலில் புகாரளிக்கவும்!',
    severe_delay: 'கடுமையான தாமதம்',
    section_delay_hold: 'பிரிவு தாமத நிறுத்தம்',
    low_confidence: 'குறைந்த முன்கணிப்பு நம்பிக்கை',
    search_train: 'பெயர் அல்லது எண் மூலம் ரயிலைத் தேடுங்கள்...',
    search_fleet: 'ரயில், நிலையம் அல்லது பாதை மூலம் தேடுங்கள்...',
    filter_label: 'வடிகட்டி',
    filter_all: 'அனைத்து ரயில்கள்',
    filter_on_time: 'சரியான நேரத்தில்',
    filter_delayed: 'தாமதம்',
    filter_not_departed: 'இன்னும் புறப்படவில்லை',
    filter_arrived: 'வந்து சேர்ந்தது',
    clear_filters: 'வடிகட்டிகளை அழிக்கவும்',
    no_filter_matches: 'தேர்ந்தெடுக்கப்பட்ட வடிகட்டி மற்றும் தேடலுக்கு ஏற்ற ரயில்கள் எதுவும் இல்லை.',
      live_travel: 'நேரலை ரயில் பயணம்',
    play_travel: 'தொடரவும்',
    reset_travel: 'மீட்டமை',
    pause_travel: 'இடைநிறுத்து',
    leave_home_by: 'வீட்டிலிருந்து கிளம்ப வேண்டிய நேரம்',
    drive_time: 'பயண நேரம்',
    buffer_time: 'கூடுதல் நேரம்',
    departure_time: 'புறப்பாடு',
    traffic_condition: 'போக்குவரத்து',
    traffic_light: 'குறைவு',
    traffic_moderate: 'மிதமானது',
    traffic_heavy: 'அதிகம்',
    calculating: 'கணக்கிடப்படுகிறது...',
    enable_location_prompt: 'கிளம்பும் நேரத்தைக் காண இருப்பிடத்தை இயக்கவும்.',
    safety_subtitle: 'RPF-ன் "மேரி சஹேலி" / பெண்கள் பாதுகாப்பு திட்டம்',
    sos_hold_prompt: 'இயக்க 2 வினாடிகள் அழுத்திப் பிடிக்கவும்.',
    sos_alert_sent: 'எச்சரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது',
    min_unit: 'நிமிடம்',
    ist_unit: 'IST',
    sos_hold_subtext: 'RPF, TT மற்றும் அருகிலுள்ள பயணிகளுக்கு எச்சரிக்கும்.',
    sos_alert_desc_prefix: 'எச்சரிக்கை RPF கட்டுப்பாட்டு அறைக்கு அனுப்பப்பட்டது,',
    sos_alert_desc_suffix: 'மற்றும் அருகிலுள்ள ட்ரெய்ன்லி பயனர்களுக்கு.',
    cancel_undo: 'ரத்து செய் / செயல்தவிர்',
    auto_detection: 'தானியங்கி கண்டறிதல்',
    locating_train: 'உங்கள் ரயிலைக் கண்டறிகிறது...',
    match_found: 'பொருத்தம் கண்டறியப்பட்டது',
    matched_via_gps: 'நேரலை GPS டெலிமெட்ரி மூலம் கண்டறியப்பட்டது.',
    couldnt_detect_train: 'ரயிலைத் தானாகக் கண்டறிய முடியவில்லை.',
    loc_denied_help: 'இருப்பிட அனுமதி மறுக்கப்பட்டது. நீங்கள் கீழே உள்ள SOS மற்றும் உதவி எண்களைப் பயன்படுத்தலாம்.',
    no_train_nearby_help: 'அருகில் கண்காணிக்கப்படும் ரயில் எதுவும் இல்லை. கீழே உள்ள SOS மற்றும் உதவி எண்களைப் பயன்படுத்தலாம்.',
    tte_title: 'ரயில் டிக்கெட் பரிசோதகர் (TT)',
    coach_label: 'பெட்டி',
    illustrative_data: '*விளக்க அடைவுத் தகவல்',
    next_station_rpf: 'அடுத்த நிலைய RPF போஸ்ட்',
    rpf_post: 'RPF போஸ்ட்',
    eta_label: 'வருகை நேரம்',
    contact_not_avail: 'தொடர்பு கிடைக்கவில்லை — உடனடி உதவிக்கு 182 ஐ அழைக்கவும்.',
    quick_dial_helplines: 'விரைவு உதவி எண்கள் (சரிபார்க்கப்பட்டது)',
    rpf_womens_security: 'RPF பெண்கள் பாதுகாப்பு',
    grp_helpline: 'GRP மாநில ரயில்வே காவல்',
    railmadad_enquiry: 'ரயில்மதத் பொது விசாரணை',
    nearest_station: 'அருகிலுள்ள நிலையம்',
    change_station: 'மாற்று',
    no_nearby_station: 'இந்த வழியில் அருகிலுள்ள நிலையத்தைக் கண்டறிய முடியவில்லை',
    select_boarding_station: 'ஏறும் நிலையத்தைத் தேர்ந்தெடுக்கவும்',
    auto_matched: 'தானாகப் பொருந்தியது',
    search_station: 'நிலையத்தைத் தேடுங்கள்...',
    no_stations_found: 'எந்த நிலையமும் கிடைக்கவில்லை',
},
  TE: {
    app_name: 'ట్రైన్లీ',
    app_tagline: 'నిజ-సమయ ETA, స్థిర కాలపట్టికలు కావు. భారతీయ రైల్వే ప్రత్యక్ష అంచనాలు.',
    welcome_back: 'స్వాగతం',
    login_subtitle: 'మీ రైళ్లను ట్రాక్ చేయడానికి లాగిన్ అవ్వండి.',
    email: 'ఈమెయిల్ చిరునామా',
    password: 'పాస్‌వర్డ్',
    forgot_password: 'పాస్‌వర్డ్ మర్చిపోయారా?',
    log_in: 'లాగిన్ అవ్వండి',
    continue_as_guest: 'అతిథిగా కొనసాగండి',
    new_here: 'కొత్తవారా?',
    create_account: 'ఖాతాను సృష్టించండి',
    already_have_account: 'ఖాతా ఉందా? లాగిన్ అవ్వండి',
    full_name: 'పూర్తి పేరు',
    sign_up: 'నమోదు చేసుకోండి',
    nav_tracker: 'ప్రత్యక్ష ట్రాకర్',
    nav_fleet: 'రైళ్ల సమాచారం',
    nav_assistant: 'ఏఐ సహాయకుడు',
    nav_feedback: 'ఆలస్య నివేదిక',
    nav_safety: 'భద్రత & SOS',
    nav_control_room: 'కంట్రోల్ రూమ్',
    dashboard: 'డాష్‌బోర్డ్',
    on_time: 'సమయానికి',
    delayed: 'ఆలస్యం',
    why_this_eta: 'ఈ ETA ఎందుకు? (ML వివరణ)',
    journey_log: 'ప్రత్యక్ష ప్రయాణ వివరాలు',
    fleet_overview: 'రైళ్ల అవలోకనం',
    sort_by_delay: 'ఆలస్యం ప్రకారం అమర్చండి',
    sort_by_train: 'రైలు సంఖ్య ప్రకారం అమర్చండి',
    updated_ago: 'నవీకరించబడింది',
    currently_near: 'ప్రస్తుతం సమీపంలో',
    next_stop: 'తదుపరి స్టేషన్',
    confidence: 'విశ్వసనీయత',
    ask_anything: 'రైలు, స్టేషన్ లేదా లైన్ క్లియరెన్స్ గురించి అడగండి',
    ask_placeholder: 'మీ రైలు లేదా స్టేషన్ గురించి అడగండి...',
    quick_why_late: 'నా రైలు ఎందుకు ఆలస్యమైంది?',
    quick_nearest: 'ప్రస్తుత సమీప స్టేషన్',
    quick_best_time: 'స్టేషన్‌కు వెళ్లడానికి సరైన సమయం',
    quick_vande_lucknow: 'వందే భారత్ సమయానికి లక్నో చేరుకుంటుందా?',
    quick_manduadih: 'మండువాడీ ఎక్స్‌ప్రెస్ సాధారణంగా ఇంత ఆలస్యమవుతుందా?',
    report_delay: 'ఆలస్య కారణాన్ని నివేదించండి',
    select_train: 'రైలును ఎంచుకోండి',
    delay_cause: 'ఆలస్య కారణం ట్యాగ్',
    optional_note: 'ఐచ్ఛిక గమనిక (ఉదా. ఔటర్ సిగ్నల్ వద్ద ఆగింది)',
    submit_report: 'నివేదిక సమర్పించండి',
    recent_reports: 'ఇటీవలి ప్రయాణీకుల నివేదికలు',
    for_passengers: '(ప్రయాణీకులకు)',
    agree: 'సమ్మతి',
    disagree: 'వ్యతిరేకించు',
    confirmed_by: 'ధృవీకరించినవారు',
    others: 'ప్రయాణీకులు',
    confirm_action: 'ధృవీకరించు',
    control_room_title: 'ఆపరేషన్స్ కంట్రోల్ రూమ్',
    avg_fleet_delay: 'సగటు రైళ్ల ఆలస్యం',
    on_time_count: 'సమయపాలన రేటు',
    active_alerts: 'కీలక హెచ్చరికలు',
    avg_confidence: 'సగటు ML విశ్వసనీయత',
    needs_attention: 'వెంటనే శ్రద్ధ వహించాల్సినవి',
    fleet_status_table: 'రైళ్ల టెలిమెట్రీ పట్టిక',
    top_delay_sections: 'అధిక ఆలస్యమయ్యే విభాగాలు',
    recent_passenger_feedback: 'ప్రత్యక్ష ప్రయాణీకుల సమాచారం',
    api_access_panel: 'కంట్రోల్ రూమ్ కోసం ఓపెన్ API',
    copy_endpoint: 'API చిరునామా కాపీ చేయండి',
    copied: 'కాపీ చేయబడింది!',
    edit_profile: 'ప్రొఫైల్ సవరించండి',
    change_password: 'పాస్‌వర్డ్ మార్చండి',
    log_out: 'లాగ్ అవుట్',
    guest_notice: 'మీరు అతిథిగా చూస్తున్నారు. నివేదించడానికి లాగిన్ అవ్వండి.',
    track_on_map: 'మ్యాప్‌లో ట్రాక్ చేయండి',
    center_on_train: 'రైలుపై కేంద్రీకరించు',
    fit_route: 'మొత్తం రూట్ చూపించు',
    speed: 'వేగం',
    live_navigation: 'లైవ్ నావిగేషన్ మోడ్',
    fog: 'పొగమంచు',
    signal: 'సిగ్నల్ ఆలస్యం',
    congestion: 'ట్రాక్ రద్దీ',
    late_start: 'ఆలస్యంగా ప్రారంభం',
    technical: 'సాంకేతిక సమస్య',
    other: 'ఇతర కారణం',
    departed: 'బయలుదేరింది',
    en_route: 'మార్గంలో ఉంది',
    predicted: 'అంచనా వేయబడిన సమయం',
    scheduled: 'షెడ్యూల్డ్',
    yet_to_depart: 'బయలుదేరాల్సి ఉంది',
    not_departed_yet: 'ఇంకా బయలుదేరలేదు',
    scheduled_departure: 'షెడ్యూల్డ్ బయలుదేరే సమయం',
    journey_yet_to_start: 'ప్రయాణం ఇంకా ప్రారంభం కాలేదు',
    train_not_departed_banner: 'రైలు ఇంకా బయలుదేరలేదు',
    train_completed_banner: 'రైలు తన చివరి గమ్యస్థానానికి చేరుకుంది',
    arrived: 'చేరింది',
    arrived_at: 'చేరిన సమయం',
    journey_completed: 'ప్రయాణం పూర్తయింది',
    reached_final_station: 'చివరి స్టేషన్‌కు చేరుకుంది',
    origin: 'ప్రారంభ స్టేషన్',
    current: 'ప్రస్తుత ప్రదేశం',
    destination: 'గమ్యస్థానం',
    issue: 'సమస్య',
    passenger_report: 'ప్రయాణీకుల నివేదిక',
    no_passenger_reports: 'ఇంకా ఎలాంటి ప్రయాణీకుల నివేదికలు లేవు',
    confidence_interval: '80% అంచనా విరామం',
    dispatch_bottlenecks: 'డిస్పాచ్ & సెక్షన్ అడ్డంకులు',
    live_telemetry_connected: 'లైవ్ టెలిమెట్రీ స్ట్రీమ్ కనెక్ట్ అయింది',
    across_monitored_corridors: '4 పర్యవేక్షించబడుతున్న కారిడార్లలో',
    punctuality_index: 'సమయపాలన సూచిక',
    requires_section_review: 'సెక్షన్ సమీక్ష అవసరం',
    inspect_telemetry: 'మార్గం టెలిమెట్రీని తనిఖీ చేయండి',
    train_col: 'రైలు',
    route_col: 'మార్గం',
    current_near_col: 'ప్రస్తుతం సమీపంలో',
    next_stop_eta_col: 'తదుపరి స్టాప్ & ETA',
    delay_status_col: 'ఆలస్య స్థితి',
    action_col: 'చర్య',
    track_btn: 'ట్రాక్ చేయండి',
    avg: 'సగటు',
    congestion_label: 'రద్దీ',
    optional_note_placeholder: 'ఉదా. జంక్షన్‌కు ముందు ఔటర్ అప్రోచ్ సిగ్నల్ వద్ద ఆగింది',
    live_passenger_delay_stream: 'లైవ్ ప్రయాణీకుల ఆలస్య స్ట్రీమ్',
    reports_count: 'నివేదికలు',
    by: 'ద్వారా',
    confirmed: 'ధృవీకరించబడింది',
    just_now: 'ఇప్పుడే',
    m_ago: 'నిమిషాల క్రితం',
    h_ago: 'గంటల క్రితం',
    highest_delay_corridor: 'అత్యధిక ఆలస్య కారిడార్',
    currently_between: 'ప్రస్తుతం మధ్య',
    and: 'మరియు',
    built_by_innobharat: 'ఇన్నోభారత్ ద్వారా రూపొందించబడింది',
    live_active_trains: 'ప్రత్యక్ష క్రియాశీల రైళ్లు',
    fleet_subtitle: 'మల్టీ-కారిడార్ ప్రత్యక్ష ట్రాకింగ్ & డైనమిక్ ఆలస్య అంచనాలు',
    live_ntes_telemetry_badge: 'లైవ్ NTES టెలిమెట్రీ & AI క్వాంటైల్ సూచన',
    connecting_ntes: 'లైవ్ NTES టెలిమెట్రీకి కనెక్ట్ అవుతోంది...',
    live_gps_speed: 'లైవ్ జీపీఎస్ వేగం',
    scroll_to_trace: 'మార్గాన్ని చూడటానికి స్క్రోల్ చేయండి ↕',
    stations_count: 'స్టేషన్లు',
    seconds_short: 'సెకన్ల క్రితం',
    delay_subtitle: 'న్యూరల్ మోడళ్లకు తక్షణ సమాచారాన్ని అందించడానికి ప్రస్తుత ఆలస్య కారకాన్ని ఎంచుకోండి.',
    submitted_success: 'నిజ-సమయ మోడల్‌కు సమర్పించబడింది!',
    submitting: 'సమర్పిస్తోంది...',
    no_reports_yet: 'ఈ రైలుకు ఇంకా ప్రయాణీకుల నివేదికలు లేవు. పైన మొదటగా నివేదించండి!',
    severe_delay: 'తీవ్రమైన ఆలస్యం',
    section_delay_hold: 'సెక్షన్ ఆలస్య నిలుపుదల',
    low_confidence: 'తక్కువ అంచనా విశ్వసనీయత',
    search_train: 'పేరు లేదా నంబర్ ద్వారా రైలును శోధించండి...',
    search_fleet: 'రైలు, స్టేషన్ లేదా మార్గం ద్వారా శోధించండి...',
    filter_label: 'ఫిల్టర్',
    filter_all: 'అన్ని రైళ్లు',
    filter_on_time: 'సమయానికి',
    filter_delayed: 'ఆలస్యం',
    filter_not_departed: 'ఇంకా బయలుదేరలేదు',
    filter_arrived: 'చేరుకుంది',
    clear_filters: 'ఫిల్టర్లను క్లియర్ చేయండి',
    no_filter_matches: 'ఎంచుకున్న ఫిల్టర్ మరియు శోధనకు సరిపోలే రైళ్లు ఏవీ కనుగొనబడలేదు.',
      live_travel: 'లైవ్ రైలు ప్రయాణం',
    play_travel: 'కొనసాగించు',
    reset_travel: 'రీసెట్',
    pause_travel: 'పాజ్ చేయి',
    leave_home_by: 'ఇంటి నుండి బయలుదేరవలసిన సమయం',
    drive_time: 'ప్రయాణ సమయం',
    buffer_time: 'బఫర్',
    departure_time: 'బయలుదేరు సమయం',
    traffic_condition: 'ట్రాఫిక్',
    traffic_light: 'తక్కువ',
    traffic_moderate: 'మధ్యస్థం',
    traffic_heavy: 'భారీ',
    calculating: 'లెక్కించబడుతోంది...',
    enable_location_prompt: 'ఎప్పుడు బయలుదేరాలో చూడటానికి లొకేషన్‌ను ప్రారంభించండి.',
    safety_subtitle: 'RPF వారి "మేరీ సహేలి" / ఆపరేషన్ మహిళా సురక్ష కార్యక్రమం',
    sos_hold_prompt: 'యాక్టివేట్ చేయడానికి 2 సెకన్లు నొక్కి పట్టుకోండి.',
    sos_alert_sent: 'హెచ్చరిక విజయవంతంగా పంపబడింది',
    min_unit: 'నిమిషాలు',
    ist_unit: 'IST',
    sos_hold_subtext: 'RPF, TT మరియు సమీపంలోని వినియోగదారులను హెచ్చరిస్తుంది.',
    sos_alert_desc_prefix: 'హెచ్చరిక RPF నియంత్రణ గదికి పంపబడింది,',
    sos_alert_desc_suffix: 'మరియు సమీపంలోని Trainly వినియోగదారులకు.',
    cancel_undo: 'రద్దు చేయి / వెనక్కి తీసుకో',
    auto_detection: 'ఆటో డిటెక్షన్',
    locating_train: 'మీ రైలును గుర్తిస్తోంది...',
    match_found: 'రైలు సరిపోలింది',
    matched_via_gps: 'లైవ్ GPS టెలిమెట్రీ సహసంబంధం ద్వారా సరిపోలింది.',
    couldnt_detect_train: 'మీ రైలును స్వయంచాలకంగా గుర్తించలేకపోయాము.',
    loc_denied_help: 'లొకేషన్ అనుమతి నిరాకరించబడింది. మీరు ఇప్పటికీ దిగువన ఉన్న SOS మరియు హెల్ప్‌లైన్ బటన్‌లను ఉపయోగించవచ్చు.',
    no_train_nearby_help: 'సమీపంలో ట్రాక్ చేయబడిన రైలు ఏదీ లేదు. మీరు దిగువన ఉన్న SOS మరియు హెల్ప్‌లైన్ బటన్‌లను ఉపయోగించవచ్చు.',
    tte_title: 'ట్రైన్ టికెట్ ఎగ్జామినర్ (TT)',
    coach_label: 'కోచ్',
    illustrative_data: '*వివరణాత్మక డైరెక్టరీ డేటా',
    next_station_rpf: 'తదుపరి స్టేషన్ RPF పోస్ట్',
    rpf_post: 'RPF పోస్ట్',
    eta_label: 'చేరుకునే సమయం',
    contact_not_avail: 'సంప్రదింపు వివరాలు అందుబాటులో లేవు — తక్షణ సహాయం కోసం 182 ని సంప్రదించండి.',
    quick_dial_helplines: 'త్వరిత హెల్ప్‌లైన్ నంబర్లు (ధృవీకరించబడినవి)',
    rpf_womens_security: 'RPF మహిళా భద్రత',
    grp_helpline: 'GRP హెల్ప్‌లైన్ రాష్ట్ర రైల్వే పోలీస్',
    railmadad_enquiry: 'రైల్ మదద్ సాధారణ విచారణ',
    nearest_station: 'సమీప స్టేషన్',
    change_station: 'మార్చండి',
    no_nearby_station: 'ఈ మార్గంలో సమీప స్టేషన్‌ను గుర్తించలేకపోయాము',
    select_boarding_station: 'బోర్డింగ్ స్టేషన్‌ను ఎంచుకోండి',
    auto_matched: 'ఆటో సరిపోలింది',
    search_station: 'స్టేషన్ శోధించండి...',
    no_stations_found: 'స్టేషన్లు ఏవీ కనుగొనబడలేదు',
},
  ML: {
    app_name: 'ട്രെയിൻലി',
    app_tagline: 'തത്സമയ വരവ് സമയം, സ്ഥിര സമയപ്പട്ടികയല്ല. ഇന്ത്യൻ റെയിൽവേയ്ക്കായുള്ള ലൈവ് പ്രവചനങ്ങൾ.',
    welcome_back: 'സ്വാഗതം',
    login_subtitle: 'ട്രെയിനുകൾ ട്രാക്ക് ചെയ്യാൻ ലോഗിൻ ചെയ്യുക.',
    email: 'ഇമെയിൽ വിലാസം',
    password: 'പാസ്‌വേഡ്',
    forgot_password: 'പാസ്‌വേഡ് മറന്നോ?',
    log_in: 'ലോഗിൻ ചെയ്യുക',
    continue_as_guest: 'അതിഥിയായി തുടരുക',
    new_here: 'പുതിയ ഉപഭോക്താവാണോ?',
    create_account: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    already_have_account: 'അക്കൗണ്ടുണ്ടോ? ലോഗിൻ ചെയ്യുക',
    full_name: 'പൂർണ്ണമായ പേര്',
    sign_up: 'സൈൻ അപ്പ്',
    nav_tracker: 'ലൈവ് ട്രാക്കർ',
    nav_fleet: 'ട്രെയിൻ വിവരങ്ങൾ',
    nav_assistant: 'എഐ സഹായി',
    nav_feedback: 'വൈകൽ റിപ്പോർട്ട്',
    nav_safety: 'സുരക്ഷ & SOS',
    nav_control_room: 'കൺട്രോൾ റൂം',
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    on_time: 'കൃത്യസമയത്ത്',
    delayed: 'വൈകുന്നു',
    why_this_eta: 'ഈ വരവ് സമയം എന്തുകൊണ്ട്? (ML വിശദീകരണം)',
    journey_log: 'ലൈവ് യാത്രാ ലോഗ്',
    fleet_overview: 'ട്രെയിനുകളുടെ സ്ഥിതി',
    sort_by_delay: 'വൈകിയ ക്രമത്തിൽ',
    sort_by_train: 'ട്രെയിൻ നമ്പർ ക്രമത്തിൽ',
    updated_ago: 'അപ്ഡേറ്റ് ചെയ്തത്',
    currently_near: 'ഇപ്പോൾ സമീപം',
    next_stop: 'അടുത്ത സ്റ്റോപ്പ്',
    confidence: 'വിശ്വാസ്യത',
    ask_anything: 'ഏത് ട്രെയിൻ, സ്റ്റേഷൻ, ലൈൻ ക്ലിയറൻസ് എന്നിവയെക്കുറിച്ചും ചോദിക്കാം',
    ask_placeholder: 'നിങ്ങളുടെ ട്രെയിൻ അല്ലെങ്കിൽ സ്റ്റേഷനെക്കുറിച്ച് ചോദിക്കുക...',
    quick_why_late: 'എന്റെ ട്രെയിൻ എന്തുകൊണ്ട് വൈകുന്നു?',
    quick_nearest: 'ഇപ്പോഴത്തെ അടുത്ത സ്റ്റേഷൻ',
    quick_best_time: 'സ്റ്റേഷനിലേക്ക് പോകാൻ അനുയോജ്യമായ സമയം',
    quick_vande_lucknow: 'വന്ദേ ഭാരത് കൃത്യസമയത്ത് ലഖ്‌നൗവിലെത്തുമോ?',
    quick_manduadih: 'മണ്ഡുവാഡിഹ് എക്സ്പ്രസ് സാധാരണയായി ഇത്രയും വൈകാറുണ്ടോ?',
    report_delay: 'വൈകാനുള്ള കാരണം റിപ്പോർട്ട് ചെയ്യുക',
    select_train: 'ട്രെയിൻ തിരഞ്ഞെടുക്കുക',
    delay_cause: 'വൈകാനുള്ള കാരണം',
    optional_note: 'കുറിപ്പ് (ഉദാഹരണത്തിന് സിഗ്നലിൽ കാത്തുനിൽക്കുന്നു)',
    submit_report: 'റിപ്പോർട്ട് സമർപ്പിക്കുക',
    recent_reports: 'യാത്രക്കാരുടെ സമീപകാല റിപ്പോർട്ടുകൾ',
    for_passengers: '(യാത്രക്കാർക്കായി)',
    agree: 'യോജിക്കുന്നു',
    disagree: 'വിയോജിക്കുന്നു',
    confirmed_by: 'സ്ഥിരീകരിച്ചവർ',
    others: 'യാത്രക്കാർ',
    confirm_action: 'സ്ഥിരീകരിക്കുക',
    control_room_title: 'ഓപ്പറേഷൻസ് കൺട്രോൾ റൂം',
    avg_fleet_delay: 'ശരാശരി കാലതാമസം',
    on_time_count: 'കൃത്യസമയ നിരക്ക്',
    active_alerts: 'പ്രധാന മുന്നറിയിപ്പുകൾ',
    avg_confidence: 'ശരാശരി ML വിശ്വാസ്യത',
    needs_attention: 'ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ',
    fleet_status_table: 'ട്രെയിൻ വിവര പട്ടിക',
    top_delay_sections: 'കൂടുതൽ വൈകുന്ന റൂട്ടുകൾ',
    recent_passenger_feedback: 'യാത്രക്കാരുടെ അഭിപ്രായങ്ങൾ',
    api_access_panel: 'കൺട്രോൾ റൂം API',
    copy_endpoint: 'API വിലാസം പകർപ്പാവകാശം',
    copied: 'പകർത്തി!',
    edit_profile: 'പ്രൊഫൈൽ മാറ്റുക',
    change_password: 'പാസ്‌വേഡ് മാറ്റുക',
    log_out: 'ലോഗ് ഔട്ട്',
    guest_notice: 'നിങ്ങൾ അതിഥിയായി കാണുന്നു. റിപ്പോർട്ട് ചെയ്യാൻ ലോഗിൻ ചെയ്യുക.',
    track_on_map: 'മാപ്പിൽ കാണുക',
    center_on_train: 'ട്രെയിനിൽ കേന്ദ്രീകരിക്കുക',
    fit_route: 'മുഴുവൻ റൂട്ടും കാണിക്കുക',
    speed: 'വേഗത',
    live_navigation: 'ലൈവ് നാവിഗേഷൻ മോഡ്',
    fog: 'മഞ്ഞുമൂടി',
    signal: 'സിഗ്നൽ കാത്തുനിൽക്കൽ',
    congestion: 'ട്രാക്ക് തിരക്ക്',
    late_start: 'വൈകി പുറപ്പെടൽ',
    technical: 'സാങ്കേതിക തകരാർ',
    other: 'മറ്റു കാരണങ്ങൾ',
    departed: 'പുറപ്പെട്ടു',
    en_route: 'യാത്രയിൽ',
    predicted: 'പ്രതീക്ഷിക്കുന്ന സമയം',
    scheduled: 'നിശ്ചയിച്ചത്',
    yet_to_depart: 'പുറപ്പെടാൻ ബാക്കി',
    not_departed_yet: 'ഇതുവരെ പുറപ്പെട്ടിട്ടില്ല',
    scheduled_departure: 'നിശ്ചയിച്ച പുറപ്പെടൽ',
    journey_yet_to_start: 'യാത്ര ഇതുവരെ ആരംഭിച്ചിട്ടില്ല',
    train_not_departed_banner: 'ട്രെയിൻ ഇതുവരെ പുറപ്പെട്ടിട്ടില്ല',
    train_completed_banner: 'ട്രെയിൻ അന്തിമ സ്റ്റേഷനിൽ എത്തിച്ചേർന്നു',
    arrived: 'എത്തി',
    arrived_at: 'എത്തിയ സമയം',
    journey_completed: 'യാത്ര പൂർത്തിയായി',
    reached_final_station: 'അന്തിമ സ്റ്റേഷനിൽ എത്തി',
    origin: 'ആരംഭ സ്റ്റേഷൻ',
    current: 'നിലവിലെ സ്ഥലം',
    destination: 'ലക്ഷ്യസ്ഥാനം',
    issue: 'പ്രശ്നം',
    passenger_report: 'യാത്രക്കാരുടെ റിപ്പോർട്ട്',
    no_passenger_reports: 'യാത്രക്കാരുടെ റിപ്പോർട്ടുകൾ ഇതുവരെ ലഭ്യമല്ല',
    confidence_interval: '80% പ്രവചന ഇടവേള',
    dispatch_bottlenecks: 'ഡിസ്പാച്ച് & സെക്ഷൻ തടസ്സങ്ങൾ',
    live_telemetry_connected: 'തത്സമയ ടെലിമെട്രി സ്ട്രീം ബന്ധിപ്പിച്ചിരിക്കുന്നു',
    across_monitored_corridors: '4 നിരീക്ഷിക്കപ്പെടുന്ന ഇടനാഴികളിൽ',
    punctuality_index: 'സമയനിഷ്ഠ സൂചിക',
    requires_section_review: 'സെക്ഷൻ പുനരവലോകനം ആവശ്യമാണ്',
    inspect_telemetry: 'റൂട്ട് ടെലിമെട്രി പരിശോധിക്കുക',
    train_col: 'ട്രെയിൻ',
    route_col: 'റൂട്ട്',
    current_near_col: 'നിലവിൽ സമീപം',
    next_stop_eta_col: 'അടുത്ത സ്റ്റോപ്പ് & ETA',
    delay_status_col: 'കാലതാമസ നില',
    action_col: 'നടപടി',
    track_btn: 'ട്രാക്ക് ചെയ്യുക',
    avg: 'ശരാശരി',
    congestion_label: 'തിരക്ക്',
    optional_note_placeholder: 'ഉദാ. ജംഗ്ഷന് മുമ്പ് ഔട്ടർ അപ്രോച്ച് സിഗ്നലിൽ നിർത്തിയിട്ടിരിക്കുന്നു',
    live_passenger_delay_stream: 'തത്സമയ യാത്രക്കാരുടെ കാലതാമസ സ്ട്രീം',
    reports_count: 'റിപ്പോർട്ടുകൾ',
    by: 'വഴി',
    confirmed: 'സ്ഥിരീകരിച്ചു',
    just_now: 'ഇപ്പോൾ മാത്രം',
    m_ago: 'മിനിറ്റ് മുമ്പ്',
    h_ago: 'മണിക്കൂർ മുമ്പ്',
    highest_delay_corridor: 'ഏറ്റവും ഉയർന്ന കാലതാമസ ഇടനാഴി',
    currently_between: 'നിലവിൽ ഇടയിൽ',
    and: 'ഒപ്പം',
    built_by_innobharat: 'ഇന്നോഭാരത് നിർമ്മിച്ചത്',
    live_active_trains: 'തത്സമയ സജീവ ട്രെയിനുകൾ',
    fleet_subtitle: 'മൾട്ടി-കോറിഡോർ സജീവ ട്രാക്കിംഗും ഡൈനാമിക് ഡിലേ പ്രവചനങ്ങളും',
    live_ntes_telemetry_badge: 'തത്സമയ NTES ടെലിമെട്രിയും AI ക്വാണ്ടൈൽ പ്രവചനവും',
    connecting_ntes: 'തത്സമയ NTES ടെലിമെട്രിയിലേക്ക് ബന്ധിപ്പിക്കുന്നു...',
    live_gps_speed: 'തത്സമയ ജിപിഎസ് വേഗത',
    scroll_to_trace: 'പാത കാണാൻ സ്ക്രോൾ ചെയ്യുക ↕',
    stations_count: 'സ്റ്റേഷനുകൾ',
    seconds_short: 'സെക്കൻഡ് മുമ്പ്',
    delay_subtitle: 'ന്യൂറൽ മോഡലുകൾക്ക് വിവരങ്ങൾ നൽകുന്നതിന് സജീവമായ കാലതാമസ ഘടകം തിരഞ്ഞെടുക്കുക.',
    submitted_success: 'തത്സമയ മോഡലിലേക്ക് സമർപ്പിച്ചു!',
    submitting: 'സമർപ്പിക്കുന്നു...',
    no_reports_yet: 'ഈ ട്രെയിനിന് ഇതുവരെ യാത്രാ റിപ്പോർട്ടുകൾ ലഭ്യമല്ല. മുകളിൽ ആദ്യം റിപ്പോർട്ട് ചെയ്യുക!',
    severe_delay: 'ഗുരുതരമായ കാലതാമസം',
    section_delay_hold: 'സെക്ഷൻ കാലതാമസ ഹോൾഡ്',
    low_confidence: 'കുറഞ്ഞ പ്രവചന വിശ്വാസ്യത',
    search_train: 'ട്രെയിൻ പേരോ നമ്പറോ ഉപയോഗിച്ച് തിരയുക...',
    search_fleet: 'ട്രെയിൻ, സ്റ്റേഷൻ അല്ലെങ്കിൽ റൂട്ട് വഴി തിരയുക...',
    filter_label: 'ഫിൽട്ടർ',
    filter_all: 'എല്ലാ ട്രെയിനുകളും',
    filter_on_time: 'കൃത്യസമയത്ത്',
    filter_delayed: 'വൈകിയത്',
    filter_not_departed: 'ഇതുവരെ പുറപ്പെട്ടിട്ടില്ല',
    filter_arrived: 'എത്തിച്ചേർന്നു',
    clear_filters: 'ഫിൽട്ടറുകൾ മായ്ക്കുക',
    no_filter_matches: 'തിരഞ്ഞെടുത്ത ഫിൽട്ടറുമായും തിരയലുമായും പൊരുത്തപ്പെടുന്ന ട്രെയിനുകളൊന്നും കണ്ടെത്തിയില്ല.',
      live_travel: 'തത്സമയ ട്രെയിൻ യാത്ര',
    play_travel: 'തുടരുക',
    reset_travel: 'പുനഃക്രമീകരിക്കുക',
    pause_travel: 'താൽക്കാലികമായി നിർത്തുക',
    leave_home_by: 'വീട്ടിൽ നിന്ന് ഇറങ്ങേണ്ട സമയം',
    drive_time: 'യാത്രാ സമയം',
    buffer_time: 'ബഫർ',
    departure_time: 'പുറപ്പെടൽ',
    traffic_condition: 'ഗതാഗതം',
    traffic_light: 'കുറവ്',
    traffic_moderate: 'മിതമായത്',
    traffic_heavy: 'കൂടുതൽ',
    calculating: 'കണക്കുകൂട്ടുന്നു...',
    enable_location_prompt: 'എപ്പോൾ ഇറങ്ങണമെന്ന് അറിയാൻ ലൊക്കേഷൻ അനുവദിക്കുക.',
    safety_subtitle: 'RPF-ന്റെ "മേരി സഹേലി" / വനിതാ സുരക്ഷാ സംരംഭം',
    sos_hold_prompt: 'പ്രവർത്തിപ്പിക്കാൻ 2 സെക്കൻഡ് അമർത്തിപ്പിടിക്കുക.',
    sos_alert_sent: 'അലർട്ട് വിജയകരമായി അയച്ചു',
    min_unit: 'മിനിറ്റ്',
    ist_unit: 'IST',
    sos_hold_subtext: 'RPF, TT, സമീപത്തുള്ള യാത്രക്കാർ എന്നിവരെ അറിയിക്കുന്നു.',
    sos_alert_desc_prefix: 'അലർട്ട് RPF കൺട്രോൾ റൂമിലേക്ക് അയച്ചു,',
    sos_alert_desc_suffix: 'കൂടാതെ സമീപത്തുള്ള Trainly ഉപയോക്താക്കൾക്കും.',
    cancel_undo: 'റദ്ദാക്കുക / പഴയപടിയാക്കുക',
    auto_detection: 'സ്വയമേവ കണ്ടെത്തൽ',
    locating_train: 'നിങ്ങളുടെ ട്രെയിൻ കണ്ടെത്തുന്നു...',
    match_found: 'ട്രെയിൻ കണ്ടെത്തി',
    matched_via_gps: 'തത്സമയ GPS ടെലിമെട്രി വഴി കണ്ടെത്തി.',
    couldnt_detect_train: 'ട്രെയിൻ സ്വയമേവ കണ്ടെത്താനായില്ല.',
    loc_denied_help: 'ലൊക്കേഷൻ അനുമതി നിരസിച്ചു. താഴെയുള്ള SOS, ഹെൽപ്പ്‌ലൈൻ ബട്ടണുകൾ നിങ്ങൾക്ക് ഉപയോഗിക്കാം.',
    no_train_nearby_help: 'സമീപത്ത് ട്രാക്ക് ചെയ്യുന്ന ട്രെയിനുകളൊന്നുമില്ല. താഴെയുള്ള SOS, ഹെൽപ്പ്‌ലൈൻ ബട്ടണുകൾ ഉപയോഗിക്കാം.',
    tte_title: 'ട്രെയിൻ ടിക്കറ്റ് എക്സാമിനർ (TT)',
    coach_label: 'കോച്ച്',
    illustrative_data: '*സൂചക ഡയറക്ടറി വിവരങ്ങൾ',
    next_station_rpf: 'അടുത്ത സ്റ്റേഷൻ RPF പോസ്റ്റ്',
    rpf_post: 'RPF പോസ്റ്റ്',
    eta_label: 'എത്തുന്ന സമയം',
    contact_not_avail: 'ബന്ധപ്പെടാനുള്ള നമ്പർ ലഭ്യമല്ല — അടിയന്തര സഹായത്തിന് 182 വിളിക്കുക.',
    quick_dial_helplines: 'ഹെൽപ്പ്‌ലൈൻ നമ്പറുകൾ (പരിശോധിച്ചത്)',
    rpf_womens_security: 'RPF വനിതാ സുരക്ഷ',
    grp_helpline: 'GRP ഹെൽപ്പ്‌ലൈൻ റെയിൽവേ പോലീസ്',
    railmadad_enquiry: 'റെയിൽമദദ് പൊതു അന്വേഷണം',
    nearest_station: 'ഏറ്റവും അടുത്തുള്ള സ്റ്റേഷൻ',
    change_station: 'മാറ്റുക',
    no_nearby_station: 'ഈ റൂട്ടിൽ അടുത്തുള്ള സ്റ്റേഷൻ കണ്ടെത്താനായില്ല',
    select_boarding_station: 'ബോർഡിംഗ് സ്റ്റേഷൻ തിരഞ്ഞെടുക്കുക',
    auto_matched: 'സ്വയമേവ തിരഞ്ഞെടുത്തു',
    search_station: 'സ്റ്റേഷൻ തിരയുക...',
    no_stations_found: 'സ്റ്റേഷനുകളൊന്നും കണ്ടെത്തിയില്ല',
}
};

// Station name dictionary for all languages
const STATION_TRANSLATIONS: Record<string, Record<Language, string>> = {
  'Meerut City Jn': { EN: 'Meerut City Jn', HI: 'मेरठ सिटी जंक्शन', TA: 'மீரட் சிட்டி சந்திப்பு', TE: 'మీరట్ సిటీ జంక్షన్', ML: 'മീററ്റ് സിറ്റി ജംഗ്ഷൻ' },
  'Hapur Jn': { EN: 'Hapur Jn', HI: 'हापुड़ जंक्शन', TA: 'ஹாபூர் சந்திப்பு', TE: 'హాపూర్ జంక్షన్', ML: 'ഹാപൂർ ജംഗ്ഷൻ' },
  'Moradabad Jn': { EN: 'Moradabad Jn', HI: 'मुरादाबाद जंक्शन', TA: 'மொராதாபாத் சந்திப்பு', TE: 'మొరాదాబాద్ జంక్షన్', ML: 'മൊറാദാബാദ് ജംഗ്ഷൻ' },
  'Bareilly Jn': { EN: 'Bareilly Jn', HI: 'बरेली जंक्शन', TA: 'பரேலி சந்திப்பு', TE: 'బరేలీ జంక్షన్', ML: 'ബറേലി ജംഗ്ഷൻ' },
  'Lucknow Charbagh': { EN: 'Lucknow Charbagh', HI: 'लखनऊ चारबाग', TA: 'லக்னோ சார்பாக்', TE: 'లక్నో చార్‌బాగ్', ML: 'ലഖ്‌നൗ ചാർബാഗ്' },
  'Ayodhya Dham Jn': { EN: 'Ayodhya Dham Jn', HI: 'अयोध्या धाम जंक्शन', TA: 'அயோத்தி தாம் சந்திப்பு', TE: 'అయోధ్య ధామ్ జంక్షన్', ML: 'അയോദ്ധ്യ ധാം ജംഗ്ഷൻ' },
  'Varanasi Jn': { EN: 'Varanasi Jn', HI: 'वाराणसी जंक्शन', TA: 'வாரணாசி சந்திப்பு', TE: 'వారణాసి జంక్షన్', ML: 'വാരാണസി ജംഗ്ഷൻ' },
  'Mumbai Central': { EN: 'Mumbai Central', HI: 'मुंबई सेंट्रल', TA: 'மும்பை சென்ட்ரல்', TE: 'ముంబై సెంట్రల్', ML: 'മുംബൈ സെൻട്രൽ' },
  'Borivali': { EN: 'Borivali', HI: 'बोरीवली', TA: 'போரிவலி', TE: 'బోరివలి', ML: 'ബോറിവലി' },
  'Surat': { EN: 'Surat', HI: 'सूरत', TA: 'சூரத்', TE: 'సూరత్', ML: 'സൂററ്റ്' },
  'Vadodara Jn': { EN: 'Vadodara Jn', HI: 'वडोदरा जंक्शन', TA: 'வதோதரா சந்திப்பு', TE: 'వడోదర జంక్షన్', ML: 'വഡോദര ജംഗ്ഷൻ' },
  'Ratlam Jn': { EN: 'Ratlam Jn', HI: 'रतलाम जंक्शन', TA: 'ரத்லாம் சந்திப்பு', TE: 'రత్లాం జంక్షన్', ML: 'രത്‌ലാം ജംഗ്ഷൻ' },
  'Kota Jn': { EN: 'Kota Jn', HI: 'कोटा जंक्शन', TA: 'கோட்டா சந்திப்பு', TE: 'కోటా జంక్షన్', ML: 'കോട്ട ജംഗ്ഷൻ' },
  'New Delhi': { EN: 'New Delhi', HI: 'नई दिल्ली', TA: 'புது தில்லி', TE: 'న్యూఢిల్లీ', ML: 'ന്യൂഡൽഹി' },
  'Chennai Central': { EN: 'Chennai Central', HI: 'चेन्नई सेंट्रल', TA: 'சென்னை சென்ட்ரல்', TE: 'చెన్నై సెంట్రల్', ML: 'ചെന്നൈ സെൻട്രൽ' },
  'Vijayawada Jn': { EN: 'Vijayawada Jn', HI: 'विजयवाड़ा जंक्शन', TA: 'விஜயவாடா சந்திப்பு', TE: 'విజయవాడ జంక్షన్', ML: 'വിജയവാഡ ജംഗ്ഷൻ' },
  'Warangal': { EN: 'Warangal', HI: 'वारंगल', TA: 'வாரங்கல்', TE: 'వరంగల్', ML: 'വാറങ്കൽ' },
  'Balharshah Jn': { EN: 'Balharshah Jn', HI: 'बल्हारशाह जंक्शन', TA: 'பல்ஹார்ஷா சந்திப்பு', TE: 'బల్హార్షా జంక్షన్', ML: 'ബൽഹാർഷാ ജംഗ്ഷൻ' },
  'Wardha Jn': { EN: 'Wardha Jn', HI: 'वर्धा जंक्शन', TA: 'வர்தா சந்திப்பு', TE: 'వర్ధా జంక్షన్', ML: 'വർദ്ധാ ജംഗ്ഷൻ' },
  'Nagpur Jn': { EN: 'Nagpur Jn', HI: 'नागपुर जंक्शन', TA: 'நாக்பூர் சந்திப்பு', TE: 'నాగ్‌పూర్ జంక్షన్', ML: 'നാഗ്പൂർ ജംഗ്ഷൻ' },
  'Itarsi Jn': { EN: 'Itarsi Jn', HI: 'इटारसी जंक्शन', TA: 'இடார்சி சந்திப்பு', TE: 'ఇటార్సీ జంక్షన్', ML: 'ഇറ്റാർസി ജംഗ്ഷൻ' },
  'Bhopal Jn': { EN: 'Bhopal Jn', HI: 'भोपाल जंक्शन', TA: 'போபால் சந்திப்பு', TE: 'భోపాల్ జంక్షన్', ML: 'ഭോപ്പാൽ ജംഗ്ഷൻ' },
  'VGL Jhansi Jn': { EN: 'VGL Jhansi Jn', HI: 'वीरांगना लक्ष्मीबाई झांसी', TA: 'வி.ஜி.எல் ஜான்சி சந்திப்பு', TE: 'వి.జి.ఎల్ ఝాన్సీ జంక్షన్', ML: 'വി.ജി.എൽ ഝാൻസി ജംഗ്ഷൻ' },
  'Gwalior Jn': { EN: 'Gwalior Jn', HI: 'ग्वालियर जंक्शन', TA: 'குவாலியர் சந்திப்பு', TE: 'గ్వాలియర్ జంక్షన్', ML: 'ഗ്വാളിയോർ ജംഗ്ഷൻ' },
  'Agra Cantt': { EN: 'Agra Cantt', HI: 'आगरा कैंट', TA: 'ஆக்ரா கன்ட்', TE: 'ఆగ్రా కాంట్', ML: 'ആഗ്ര കാൻ്റ്' },
  'Manduadih (Banaras)': { EN: 'Manduadih (Banaras)', HI: 'मंडुवाडीह (बनारस)', TA: 'மண்டுவாடி (பனாரஸ்)', TE: 'మండువాడీ (బెనారస్)', ML: 'മണ്ഡുവാഡിഹ് (ബനാറസ്)' },
  'Banaras / Manduadih': { EN: 'Banaras / Manduadih', HI: 'बनारस / मंडुवाडीह', TA: 'பனாரஸ் / மண்டுவாடி', TE: 'బెనారస్ / మండువాడీ', ML: 'ബനാറസ് / മണ്ഡുവാഡിഹ്' },
  'Prayagraj Chheoki': { EN: 'Prayagraj Chheoki', HI: 'प्रयागराज छिवकी', TA: 'பிரயாக்ராஜ் சிவோகி', TE: 'ప్రయాగ్‌రాజ్ ఛివోకి', ML: 'പ്രയാഗ്‌രാജ് ഛിവോക്കി' },
  'Jabalpur Jn': { EN: 'Jabalpur Jn', HI: 'जबलपुर जंक्शन', TA: 'ஜபல்பூர் சந்திப்பு', TE: 'జబల్‌పూర్ జంక్షన్', ML: 'ജബൽപൂർ ജംഗ്ഷൻ' },
  'Ongole': { EN: 'Ongole', HI: 'ओंगोल', TA: 'ஒங்கோல்', TE: 'ఒంగోలు', ML: 'ഒങ്കോൾ' },
  'Chennai Egmore': { EN: 'Chennai Egmore', HI: 'चेन्नई एग्मोर', TA: 'சென்னை எழும்பூர்', TE: 'చెన్నై ఎగ్మోర్', ML: 'ചെന്നൈ എഗ്മോർ' },
  'Villupuram Jn': { EN: 'Villupuram Jn', HI: 'विल्लुपुरम जंक्शन', TA: 'விழுப்புரம் சந்திப்பு', TE: 'విల్లుపురం జంక్షన్', ML: 'വില്ലുപുരം ജംഗ്ഷൻ' },
  'Tiruchchirappalli Jn': { EN: 'Tiruchchirappalli Jn', HI: 'तिरुच्चिराप्पल्ली जंक्शन', TA: 'திருச்சிராப்பள்ளி சந்திப்பு', TE: 'తిరుచిరాపల్లి జంక్షన్', ML: 'തിരുച്ചിറപ്പള്ളി ജംഗ്ഷൻ' },
  'Madurai Jn': { EN: 'Madurai Jn', HI: 'मदुरै जंक्शन', TA: 'மதுரை சந்திப்பு', TE: 'మదురై జంక్షన్', ML: 'മധുര ജംഗ്ഷൻ' },
  'Ramanathapuram': { EN: 'Ramanathapuram', HI: 'रामानाथापुरम', TA: 'இராமநாதபுரம்', TE: 'రామనాథపురం', ML: 'രാമനാഥപുരം' },
  'Rameswaram': { EN: 'Rameswaram', HI: 'रामेश्वरम', TA: 'இராமேஸ்வரம்', TE: 'రామేశ్వరం', ML: 'രാമേശ്വരം' },
  'Ghaziabad Jn': { EN: 'Ghaziabad Jn', HI: 'गाजियाबाद जंक्शन', TA: 'காசியாபாத் சந்திப்பு', TE: 'ఘాజియాబాద్ జంక్షన్', ML: 'ഗാസിയാബാദ് ജംഗ്ഷൻ' },
  'Aligarh Jn': { EN: 'Aligarh Jn', HI: 'अलीगढ़ जंक्शन', TA: 'அலிகார் சந்திப்பு', TE: 'అలీఘర్ జంక్షన్', ML: 'അലിഗഡ് ജംഗ്ഷൻ' },
  'Tundla Jn': { EN: 'Tundla Jn', HI: 'टूंडला जंक्शन', TA: 'துண்ட்லா சந்திப்பு', TE: 'తుండ్లా జంక్షన్', ML: 'തുണ്ട്‌ല ജംഗ്ഷൻ' },
  'Kanpur Central': { EN: 'Kanpur Central', HI: 'कानपुर सेंट्रल', TA: 'கான்பூர் சென்ட்ரல்', TE: 'కాన్పూర్ సెంట్రల్', ML: 'കാൺപൂർ సెంట్రల్' },
  'Meerut': { EN: 'Meerut', HI: 'मेरठ', TA: 'மீரட்', TE: 'మీరట్', ML: 'മീററ്റ്' },
  'Hapur': { EN: 'Hapur', HI: 'हापुड़', TA: 'ஹாபூர்', TE: 'హాపూర్', ML: 'ഹാപൂർ' },
  'Moradabad': { EN: 'Moradabad', HI: 'मुरादाबाद', TA: 'மொராதாபாத்', TE: 'మొరాదాబాద్', ML: 'മൊറാദാബാദ്' },
  'Bareilly': { EN: 'Bareilly', HI: 'बरेली', TA: 'பரேலி', TE: 'బరేలీ', ML: 'ബറേലി' },
  'Lucknow': { EN: 'Lucknow', HI: 'लखनऊ', TA: 'லக்னோ', TE: 'లక్నో', ML: 'ലഖ്‌നൗ' },
  'Ayodhya': { EN: 'Ayodhya', HI: 'अयोध्या', TA: 'அயோத்தி', TE: 'అయోధ్య', ML: 'അയോദ്ധ്യ' },
  'Ayodhya Dham': { EN: 'Ayodhya Dham', HI: 'अयोध्या धाम', TA: 'அயோத்தி தாம்', TE: 'అయోధ్య ధామ్', ML: 'അയോദ്ധ്യ ധാം' },
  'Varanasi': { EN: 'Varanasi', HI: 'वाराणसी', TA: 'வாரணாசி', TE: 'వారణాసి', ML: 'വാരാണസി' },
  'Mumbai': { EN: 'Mumbai', HI: 'मुंबई', TA: 'மும்பை', TE: 'ముంబై', ML: 'മുംബൈ' },
  'Ratlam': { EN: 'Ratlam', HI: 'रतलाम', TA: 'ரத்லாம்', TE: 'రత్లాం', ML: 'രത്‌ലാം' },
  'Kota': { EN: 'Kota', HI: 'कोटा', TA: 'கோட்டா', TE: 'కోటా', ML: 'കോട്ട' },
  'Delhi': { EN: 'Delhi', HI: 'दिल्ली', TA: 'தில்லி', TE: 'ఢిల్లీ', ML: 'ഡൽഹി' },
  'Chennai': { EN: 'Chennai', HI: 'चेन्नई', TA: 'சென்னை', TE: 'చెన్నై', ML: 'ചെന്നൈ' },
  'Vijayawada': { EN: 'Vijayawada', HI: 'विजयवाड़ा', TA: 'விஜயவாடா', TE: 'విజయవాడ', ML: 'വിജയവാഡ' },
  'Balharshah': { EN: 'Balharshah', HI: 'बल्हारशाह', TA: 'பல்ஹார்ஷா', TE: 'బల్హార్షా', ML: 'ബൽഹാർഷാ' },
  'Wardha': { EN: 'Wardha', HI: 'वर्धा', TA: 'வர்தா', TE: 'వర్ధా', ML: 'వర్ద్ధാ' },
  'Nagpur': { EN: 'Nagpur', HI: 'नागपुर', TA: 'நாக்பூர்', TE: 'నాగ్‌పూర్', ML: 'നാഗ്പൂർ' },
  'Itarsi': { EN: 'Itarsi', HI: 'इटारसी', TA: 'இடார்சி', TE: 'ఇటార్సీ', ML: 'ഇറ്റാർസി' },
  'Bhopal': { EN: 'Bhopal', HI: 'भोपाल', TA: 'போபால்', TE: 'భోపాల్', ML: 'ഭോപ്പാൽ' },
  'Jhansi': { EN: 'Jhansi', HI: 'झांसी', TA: 'ஜான்சி', TE: 'ఝాన్సీ', ML: 'ഝാൻസി' },
  'Gwalior': { EN: 'Gwalior', HI: 'ग्वालियर', TA: 'குவாலியர்', TE: 'గ్వాలియర్', ML: 'ഗ്വാളിയോർ' },
  'Agra': { EN: 'Agra', HI: 'आगरा', TA: 'ஆக்ரா', TE: 'ఆగ్రా', ML: 'ആഗ്ര' },
  'Banaras': { EN: 'Banaras', HI: 'बनारस', TA: 'பனாரஸ்', TE: 'బనారస్', ML: 'ബനാറസ്' },
  'Manduadih': { EN: 'Manduadih', HI: 'मंडुवाडीह', TA: 'மண்டுவாடி', TE: 'మండువాడీ', ML: 'മണ്ഡുവാഡിഹ്' },
  'Prayagraj': { EN: 'Prayagraj', HI: 'प्रयागराज', TA: 'பிரயாக்ராஜ்', TE: 'ప్రయాగ్‌రాజ్', ML: 'ప్రయాഗ്‌రాజ్' },
  'Ghaziabad': { EN: 'Ghaziabad', HI: 'गाजियाबाद', TA: 'காசியாபாத்', TE: 'ఘాజియాబాద్', ML: 'ഗാസിയാബാദ്' },
  'Aligarh': { EN: 'Aligarh', HI: 'अलीगढ़', TA: 'அலிகார்', TE: 'అలీఘర్', ML: 'അലിഗഡ്' },
  'Tundla': { EN: 'Tundla', HI: 'टूंडला', TA: 'துண்ட்லா', TE: 'తుండ్లా', ML: 'തുണ്ട്‌ല' },
  'Kanpur': { EN: 'Kanpur', HI: 'कानपुर', TA: 'கான்பூர்', TE: 'కాన్పూర్', ML: 'കാൺപൂർ' },
  'Thiruvananthapuram Central': { EN: 'Thiruvananthapuram Central', HI: 'तिरुवनंतपुरम सेंट्रल', TA: 'திருவனந்தபுரம் சென்ட்ரல்', TE: 'తిరువనంతపురం సెంట్రల్', ML: 'തിരുവനന്തപുരം സെൻട്രൽ' },
  'Trivandrum': { EN: 'Trivandrum', HI: 'त्रिवेंद्रम', TA: 'திருவனந்தபுரம்', TE: 'త్రివేండ్రం', ML: 'തിരുവനന്തപുരം' },
  'Kollam Jn': { EN: 'Kollam Jn', HI: 'कोल्लम जंक्शन', TA: 'கொல்லம் சந்திப்பு', TE: 'కొల్లాం జంక్షన్', ML: 'കൊല്ലം ജംഗ്ഷൻ' },
  'Kottayam': { EN: 'Kottayam', HI: 'कोट्टायम', TA: 'கோட்டயம்', TE: 'కొట్టాయం', ML: 'കോട്ടയം' },
  'Ernakulam Town': { EN: 'Ernakulam Town', HI: 'एर्नाकुलम टाउन', TA: 'எர்ணாகுளம் டவுன்', TE: 'ఎర్నాకులం టౌన్', ML: 'എറണാകുളം ടൗൺ' },
  'Thrissur': { EN: 'Thrissur', HI: 'त्रिशूर', TA: 'திருச்சூர்', TE: 'త్రిసూర్', ML: 'തൃശ്ശൂർ' },
  'Palakkad Jn': { EN: 'Palakkad Jn', HI: 'पालक्काड़ जंक्शन', TA: 'பாலக்காடு சந்திப்பு', TE: 'పాలక్కాడ్ జంక్షన్', ML: 'പാലക്കാട് ജംഗ്ഷൻ' },
  'Coimbatore Jn': { EN: 'Coimbatore Jn', HI: 'कोयंबटूर जंक्शन', TA: 'கோயம்புத்தூர் சந்திப்பு', TE: 'కోయంబత్తూర్ జంక్షన్', ML: 'കോയമ്പത്തൂർ ജംഗ്ഷൻ' },
  'Erode Jn': { EN: 'Erode Jn', HI: 'इरोड जंक्शन', TA: 'ஈரோடு சந்திப்பு', TE: 'ఈరోడ్ జంక్షన్', ML: 'ഈറോഡ് ജംഗ്ഷൻ' },
  'Salem Jn': { EN: 'Salem Jn', HI: 'सेलम जंक्शन', TA: 'சேலம் சந்திப்பு', TE: 'సేలం జంక్షన్', ML: 'സേലം ജംഗ്ഷൻ' },
  'Howrah Jn': { EN: 'Howrah Jn', HI: 'हावड़ा जंक्शन', TA: 'ஹவுரா சந்திப்பு', TE: 'హౌరా జంక్షన్', ML: 'ഹൗറ ജംഗ്ഷൻ' },
  'Howrah': { EN: 'Howrah', HI: 'हावड़ा', TA: 'ஹவுரா', TE: 'హౌరా', ML: 'ഹൗറ' },
  'Asansol Jn': { EN: 'Asansol Jn', HI: 'आसनसोल जंक्शन', TA: 'அசன்சோல் சந்திப்பு', TE: 'அసన్సోల్ జంక్షన్', ML: 'അസൻസോൾ ജംഗ്ഷൻ' },
  'Dhanbad Jn': { EN: 'Dhanbad Jn', HI: 'धनबाद जंक्शन', TA: 'தன்நாத் சந்திப்பு', TE: 'ధన్‌బాద్ జంక్షన్', ML: 'ധൻബാദ് ജംഗ്ഷൻ' },
  'Parasnath': { EN: 'Parasnath', HI: 'पारसनाथ', TA: 'பாரஸ்நாத்', TE: 'పారస్‌నాథ్', ML: 'പരസ്നാഥ്' },
  'Gaya Jn': { EN: 'Gaya Jn', HI: 'गया जंक्शन', TA: 'கயா சந்திப்பு', TE: 'గయా జంక్షన్', ML: 'ഗയ ജംഗ്ഷൻ' },
  'Pt. Deen Dayal Upadhyaya Jn': { EN: 'Pt. Deen Dayal Upadhyaya Jn', HI: 'पं. दीन दयाल उपाध्याय जंक्शन', TA: 'பண்டிட் தீன் தயாள் உபாத்யாயா சந்திப்பு', TE: 'పండిట్ దీన్ దయాల్ ఉపాధ్యాయ జంక్షన్', ML: 'പണ്ഡിറ്റ് ദീൻ ദയാൽ ഉപാധ്യായ ജംഗ്ഷൻ' },
  'Prayagraj Jn': { EN: 'Prayagraj Jn', HI: 'प्रयागराज जंक्शन', TA: 'பிரயாக்ராஜ் சந்திப்பு', TE: 'ప్రయాగ్‌రాజ్ జంక్షన్', ML: 'പ്രയാഗ്‌രാജ് ജംഗ്ഷൻ' },
  'Mathura Jn': { EN: 'Mathura Jn', HI: 'मथुरा जंक्शन', TA: 'மதுரா சந்திப்பு', TE: 'మథుర జంక్షన్', ML: 'മഥുര ജംഗ്ഷൻ' },
  'Mathura': { EN: 'Mathura', HI: 'मथुरा', TA: 'மதுரா', TE: 'మథుర', ML: 'മഥുര' },
  'Lalitpur Jn': { EN: 'Lalitpur Jn', HI: 'ललितपुर जंक्शन', TA: 'லலித்பூர் சந்திப்பு', TE: 'లలిత్‌పూర్ జంక్షన్', ML: 'ലളിത്പൂർ ജംഗ്ഷൻ' },
  'Rani Kamlapati': { EN: 'Rani Kamlapati', HI: 'रानी कमलापति', TA: 'ராணி கமலாபதி', TE: 'రాణి కమలాపతి', ML: 'റാണി കമലാപതി' },
  'Hazrat Nizamuddin': { EN: 'Hazrat Nizamuddin', HI: 'हजरत निजामुद्दीन', TA: 'ஹசரத் நிஜாமுதீன்', TE: 'హజ్రత్ నిజాముద్దీన్', ML: 'ഹസ്രത്ത് നിസാമുദ്ദീൻ' },
  'Nizamuddin': { EN: 'Nizamuddin', HI: 'निजामुद्दीन', TA: 'நிஜாமுதீன்', TE: 'నిజాముద్దీన్', ML: 'നിസാമുദ്ദീൻ' },
  'Hyderabad Decan': { EN: 'Hyderabad Decan', HI: 'हैदराबाद डेक्कन', TA: 'ஹைதராபாத் டெக்கான்', TE: 'హైదరాబాద్ డెక్కన్', ML: 'ഹൈദരാബാദ് ഡെക്കാൻ' },
  'Secunderabad Jn': { EN: 'Secunderabad Jn', HI: 'सिकंदराबाद जंक्शन', TA: 'செகந்திராபாத் சந்திப்பு', TE: 'సికింద్రాబాద్ జంక్షన్', ML: 'സെക്കന്തരാബാദ് ജംഗ്ഷൻ' },
  'Secunderabad': { EN: 'Secunderabad', HI: 'सिकंदराबाद', TA: 'செகந்திராபாத்', TE: 'సికింద్రాబాద్', ML: 'സെക്കന്തരാബാദ്' },
  'Kazipet Jn': { EN: 'Kazipet Jn', HI: 'काजीपेट जंक्शन', TA: 'காசிபேட் சந்திப்பு', TE: 'కాజీపేట్ జంక్షన్', ML: 'കാസിപ്പേട്ട് ജംഗ്ഷൻ' },
  'Ramagundam': { EN: 'Ramagundam', HI: 'रामगुंडम', TA: 'ராமகுண்டம்', TE: 'రామగుండం', ML: 'രാമഗുണ്ടം' },
  'Kharagpur Jn': { EN: 'Kharagpur Jn', HI: 'खड़गपुर जंक्शन', TA: 'கரக்பூர் சந்திப்பு', TE: 'ఖరగ్‌పూర్ జంక్షన్', ML: 'ഖരഗ്പൂർ ജംഗ്ഷൻ' },
  'Kharagpur': { EN: 'Kharagpur', HI: 'खड़गपुर', TA: 'கரக்பூர்', TE: 'ఖరగ్‌పూర్', ML: 'ഖരഗ്പൂർ' },
  'Bhubaneswar': { EN: 'Bhubaneswar', HI: 'भुवनेश्वर', TA: 'புவனேஸ்வர்', TE: 'భువనేశ్వర్', ML: 'ഭുവനേശ്വർ' },
  'Cuttack Jn': { EN: 'Cuttack Jn', HI: 'कटक जंक्शन', TA: 'கட்டாக் சந்திப்பு', TE: 'కటక్ జంక్షన్', ML: 'കട്ടക്ക് ജംഗ്ഷൻ' },
  'Visakhapatnam': { EN: 'Visakhapatnam', HI: 'विशाखापट्टनम', TA: 'விசாகப்பட்டினம்', TE: 'విశాఖపట్నం', ML: 'വിശാഖപട്ടണം' },
  'Rajahmundry': { EN: 'Rajahmundry', HI: 'राजमुंदरी', TA: 'ராஜமுந்திரி', TE: 'రాజమండ్రి', ML: 'രാജമുണ്ട്രി' },
  'Mumbai CSMT': { EN: 'Mumbai CSMT', HI: 'मुंबई सीएसएमटी', TA: 'மும்பை சி.எஸ்.எம்.டி', TE: 'ముంబై సిఎస్ఎంటి', ML: 'മുംബൈ സി.എസ്.എം.ടി' },
  'Kalyan Jn': { EN: 'Kalyan Jn', HI: 'कल्याण जंक्शन', TA: 'கல்யாண் சந்திப்பு', TE: 'కళ్యాణ్ జంక్షన్', ML: 'കല്യാൺ ജംഗ്ഷൻ' },
  'Nasik Road': { EN: 'Nasik Road', HI: 'नासिक रोड', TA: 'நாசிக் ரோடு', TE: 'నాసిక్ రోడ్', ML: 'നാസിക് റോഡ്' },
  'Bhusaval Jn': { EN: 'Bhusaval Jn', HI: 'भुसावल जंक्शन', TA: 'புசாவல் சந்திப்பு', TE: 'భుసావల్ జంక్షన్', ML: 'ഭുസാവൽ ജംഗ്ഷൻ' },
  'Firozpur Cantt': { EN: 'Firozpur Cantt', HI: 'फिरोजपुर कैंट', TA: 'பிரோஸ்பூர் கன்ட்', TE: 'ఫిరోజ్‌పూర్ కాంట్', ML: 'ഫിറോസ്പൂർ കാൻ്റ്' },
  'Shri Mata Vaishno Devi Katra': { EN: 'Shri Mata Vaishno Devi Katra', HI: 'श्री माता वैष्णो देवी कटरा', TA: 'ஸ்ரீ மாதா வைஷ்ணோ தேவி கத்ரா', TE: 'శ్రీ మాతా వైష్ణో దేవి కట్రా', ML: 'ശ്രീ മാതാ വൈഷ്ണോ ദേവി കത്ര' },
  'Jammu Tawi': { EN: 'Jammu Tawi', HI: 'जम्मू तवी', TA: 'ஜம்மு தாவி', TE: 'జమ్ము తావి', ML: 'ജമ്മു താവി' },
  'Puri': { EN: 'Puri', HI: 'पुरी', TA: 'புரி', TE: 'పూరి', ML: 'പുരി' },
  'Tatanagar Jn': { EN: 'Tatanagar Jn', HI: 'टाटानगर जंक्शन', TA: 'டாடாநகர் சந்திப்பு', TE: 'టాటానగర్ జంక్షన్', ML: 'ടാറ്റാനഗർ ജംഗ്ഷൻ' },
  'Bokaro Steel City': { EN: 'Bokaro Steel City', HI: 'बोकारो स्टील सिटी', TA: 'பொகாரோ ஸ்டீல் சிட்டி', TE: 'బొకారో స్టీల్ సిటీ', ML: 'ബൊക്കാറോ സ്റ്റീൽ സിറ്റി' },
  'Yesvantpur Jn': { EN: 'Yesvantpur Jn', HI: 'यशवंतपुर जंक्शन', TA: 'யஷ்வந்த்பூர் சந்திப்பு', TE: 'యశ్వంతపూర్ జంక్షన్', ML: 'യശ്വന്ത്പൂർ ജംഗ്ഷൻ' },
  'Ahmedabad Jn': { EN: 'Ahmedabad Jn', HI: 'अहमदाबाद जंक्शन', TA: 'அகமதாபாத் சந்திப்பு', TE: 'అహ్మదాబాద్ జంక్షన్', ML: 'അഹമ്മദാബാദ് ജംഗ്ഷൻ' },
  'Ahmedabad': { EN: 'Ahmedabad', HI: 'अहमदाबाद', TA: 'அகமதாபாத்', TE: 'అహ్మదాబాద్', ML: 'അഹമ്മദാബാദ്' },
  'KSR Bengaluru': { EN: 'KSR Bengaluru', HI: 'केएसआर बेंगलुरु', TA: 'கே.எஸ்.ஆர் பெங்களூரு', TE: 'కేఎస్ఆర్ బెంగళూరు', ML: 'കെഎസ്ആർ ബെംഗളൂരു' },
  'Bengaluru': { EN: 'Bengaluru', HI: 'बेंगलुरु', TA: 'பெங்களூரு', TE: 'బెంగళూరు', ML: 'ബെംഗളൂരു' },
  'Dibrugarh': { EN: 'Dibrugarh', HI: 'डिब्रूगढ़', TA: 'திப்ருகர்', TE: 'దిబ్రూగఢ్', ML: 'ദിബ്രുഗഡ്' },
  'Guwahati': { EN: 'Guwahati', HI: 'गुवाहाटी', TA: 'குவாஹாட்டி', TE: 'గౌహతి', ML: 'ഗുവാഹത്തി' },
  'New Jalpaiguri Jn': { EN: 'New Jalpaiguri Jn', HI: 'न्यू जलपाईगुड़ी जंक्शन', TA: 'நியூ ஜல்பைகுரி சந்திப்பு', TE: 'న్యూ జల్పైగురి జంక్షన్', ML: 'ന്യൂ ജൽപായ്ഗുരി ജംഗ്ഷൻ' },
  'Delhi Sarai Rohilla': { EN: 'Delhi Sarai Rohilla', HI: 'दिल्ली सराय रोहिल्ला', TA: 'தில்லி சராய் ரோஹில்லா', TE: 'ఢిల్లీ సరాయ్ రోహిల్లా', ML: 'ഡൽഹി സരായ് രോഹില്ല' },
  'Bandra Terminus': { EN: 'Bandra Terminus', HI: 'बांद्रा टर्मिनस', TA: 'பாந்த்ரா டெர்மினஸ்', TE: 'బాంద్రా టెర్మినస్', ML: 'ബാന്ദ്ര ടെർമിനസ്' },
  'Jaipur Jn': { EN: 'Jaipur Jn', HI: 'जयपुर जंक्शन', TA: 'ஜெய்ப்பூர் சந்திப்பு', TE: 'జైపూర్ జంక్షన్', ML: 'ജയ്പൂർ ജംഗ്ഷൻ' },
  'Ajmer Jn': { EN: 'Ajmer Jn', HI: 'अजमेर जंक्शन', TA: 'அஜ்மீர் சந்திப்பு', TE: 'అజ్మీర్ జంక్షన్', ML: 'அജ്മീർ ജംഗ്ഷൻ' },
  'Sealdah': { EN: 'Sealdah', HI: 'सियालदह', TA: 'சீல்டா', TE: 'సీల్దా', ML: 'സീൽദ' },
  'Mysuru Jn': { EN: 'Mysuru Jn', HI: 'मैसूरु जंक्शन', TA: 'மைசூரு சந்திப்பு', TE: 'మైసూరు జంక్షన్', ML: 'മൈസൂരു ജംഗ്ഷൻ' },
  'Mysuru': { EN: 'Mysuru', HI: 'मैसूरु', TA: 'மைசூரு', TE: 'మైసూరు', ML: 'മൈസൂരു' },
  'Ranchi Jn': { EN: 'Ranchi Jn', HI: 'रांची जंक्शन', TA: 'ராஞ்சி சந்திப்பு', TE: 'రాంచీ జంక్షన్', ML: 'റാഞ്ചി ജംഗ്ഷൻ' },
  'Ranchi': { EN: 'Ranchi', HI: 'रांची', TA: 'ராஞ்சி', TE: 'రాంచీ', ML: 'റാഞ്ചി' },
  'Rajendra Nagar Terminal': { EN: 'Rajendra Nagar Terminal', HI: 'राजेंद्र नगर टर्मिनल', TA: 'ராஜேந்திர நகர் டெர்மினல்', TE: 'రాజేంద్ర నగర్ టెర్మినల్', ML: 'രാജേന്ദ്ര നഗർ ടെർമിനൽ' },
  'Patna Jn': { EN: 'Patna Jn', HI: 'पटना जंक्शन', TA: 'பாட்னா சந்திப்பு', TE: 'పాట్నా జంక్షన్', ML: 'പറ്റ്ന ജംഗ്ഷൻ' },
  'Patna': { EN: 'Patna', HI: 'पटना', TA: 'பாட்னா', TE: 'పాట్నా', ML: 'പറ്റ്ന' }
};

// Dynamic text phrases translations
const DYNAMIC_PHRASES: Record<string, Record<Language, string>> = {
  'Track clear ahead of Bareilly Jn; high speed maintained.': {
    EN: 'Track clear ahead of Bareilly Jn; high speed maintained.',
    HI: 'बरेली जंक्शन के आगे ट्रैक साफ है; तेज गति बनी हुई है।',
    TA: 'பரேலி சந்திப்புக்கு முன்னால் பாதை தெளிவாக உள்ளது; அதிக வேகம் பராமரிக்கப்படுகிறது.',
    TE: 'బరేలీ జంక్షన్ ముందు ట్రాక్ స్పష్టంగా ఉంది; అధిక వేగం కొనసాగుతోంది.',
    ML: 'ബറേലി ജംഗ്ഷന് മുന്നിൽ ട്രാക്ക് വ്യക്തമാണ്; ഉയർന്ന വേഗത നിലനിർത്തുന്നു.'
  },
  'Brief stop at outer approach for 2 mins, now rolling.': {
    EN: 'Brief stop at outer approach for 2 mins, now rolling.',
    HI: 'आउटर अप्रोच पर 2 मिनट का संक्षिप्त ठहराव, अब ट्रेन चल रही है।',
    TA: 'வெளிப்புற அணுகுமுறையில் 2 நிமிடங்கள் சுருக்கமான நிறுத்தம், இப்போது நகர்கிறது.',
    TE: 'ఔటర్ అప్రోచ్ వద్ద 2 నిమిషాల స్వల్ప విరామం, ఇప్పుడు కదులుతోంది.',
    ML: 'ഔട്ടർ അപ്രോച്ചിൽ 2 മിനിറ്റ് ചെറിയ സ്റ്റോപ്പ്, ഇപ്പോൾ നീങ്ങുന്നു.'
  },
  'Precautionary speed restriction around Ratlam curve.': {
    EN: 'Precautionary speed restriction around Ratlam curve.',
    HI: 'रतलाम मोड़ के पास एहतियाती गति प्रतिबंध।',
    TA: 'ரத்லாம் வளைவைச் சுற்றி முன்னெச்சரிக்கை வேகக் கட்டுப்பாடு.',
    TE: 'రత్లాం మలుపు వద్ద ముందస్తు జాగ్రత్త వేగ పరిమితి.',
    ML: 'രത്‌ലാം വളവിന് ചുറ്റും മുൻകരുതൽ വേഗത നിയന്ത്രണം.'
  },
  'Waiting for platform clearance at Kota outer cabin.': {
    EN: 'Waiting for platform clearance at Kota outer cabin.',
    HI: 'कोटा आउटर केबिन पर प्लेटफॉर्म क्लीयरेंस की प्रतीक्षा में।',
    TA: 'கோட்டா வெளிப்புற கேபினில் பிளாட்பார்ம் அனுமதிக்காக காத்திருக்கிறது.',
    TE: 'కోటా ఔటర్ క్యాబిన్ వద్ద ప్లాట్‌ఫారమ్ క్లియరెన్స్ కోసం వేచి ఉంది.',
    ML: 'കോട്ട ഔട്ടർ ക്യാബിനിൽ പ്ലാറ്റ്‌ഫോം ക്ലിയറൻസിനായി കാത്തിരിക്കുന്നു.'
  },
  'Heavy goods train crossing priority at Wardha outer.': {
    EN: 'Heavy goods train crossing priority at Wardha outer.',
    HI: 'वर्धा आउटर पर भारी मालगाड़ी क्रॉसिंग को प्राथमिकता।',
    TA: 'வர்தா வெளிப்புறத்தில் கனரக சரக்கு ரயில் கடக்கும் முன்னுரிமை.',
    TE: 'వర్ధా ఔటర్ వద్ద భారీ గూడ్స్ రైలు క్రాసింగ్ ప్రాధాన్యత.',
    ML: 'വർദ്ധാ ഔട്ടറിൽ ഭാരവാഹക ചരക്ക് ട്രെയിൻ ക്രോസിംഗ് മുൻഗണന.'
  },
  'Slow crawl through Nagpur division freight corridor.': {
    EN: 'Slow crawl through Nagpur division freight corridor.',
    HI: 'नागपुर मंडल मालगाड़ी कॉरिडोर से धीमी गति से गुजर रही है।',
    TA: 'நாக்பூர் பிரிவு சரக்கு வழித்தடத்தில் மெதுவாக ஊர்ந்து செல்கிறது.',
    TE: 'నాగ్‌పూర్ డివిజన్ సరుకు రవాణా కారిడార్ గుండా నెమ్మదిగా కదులుతోంది.',
    ML: 'നാഗ്പൂർ ഡിവിഷൻ ചരക്ക് ഇടനാഴിയിലൂടെ പതുക്കെ നീങ്ങുന്നു.'
  },
  'Standing at outer signal before Vijayawada bypass for 40+ mins.': {
    EN: 'Standing at outer signal before Vijayawada bypass for 40+ mins.',
    HI: 'विजयवाड़ा बाईपास से पहले आउटर सिग्नल पर 40+ मिनट से खड़ी है।',
    TA: 'விஜயவாடா பைபாஸுக்கு முன் வெளிப்புற சிக்னலில் 40+ நிமிடங்களாக நிற்கிறது.',
    TE: 'విజయవాడ బైపాస్‌కు ముందు ఔటర్ సిగ్నల్ వద్ద 40+ నిమిషాలుగా నిలిచి ఉంది.',
    ML: 'വിജയവാഡ ബൈപാസിന് മുമ്പ് ഔട്ടർ സിഗ്നലിൽ 40+ മിനിറ്റായി നിർത്തിയിട്ടിരിക്കുന്നു.'
  },
  'Single line section between Vijayawada and Ongole heavily congested.': {
    EN: 'Single line section between Vijayawada and Ongole heavily congested.',
    HI: 'विजयवाड़ा और ओंगोल के बीच सिंगल लाइन सेक्शन में भारी भीड़।',
    TA: 'விஜயவாடா மற்றும் ஒங்கோல் இடையே உள்ள ஒற்றை பாதை பிரிவு அதிக நெரிசலாக உள்ளது.',
    TE: 'విజయవాడ మరియు ఒంగోలు మధ్య సింగిల్ లైన్ సెక్షన్ భారీగా రద్దీగా ఉంది.',
    ML: 'വിജയവാഡയ്ക്കും ഒങ്കോളിനും ഇടയിലുള്ള സിംഗിൾ ലൈൻ സെക്ഷനിൽ കനത്ത തിരക്ക്.'
  },
  'Turnaround rake delayed at Banaras yard.': {
    EN: 'Turnaround rake delayed at Banaras yard.',
    HI: 'बनारस यार्ड में टर्नअराउंड रेक में देरी।',
    TA: 'பனாரஸ் யார்டில் டர்ன்அரவுண்ட் ரேக் தாமதமானது.',
    TE: 'బనారస్ యార్డులో టర్నరౌండ్ రేక్ ఆలస్యమైంది.',
    ML: 'ബനാറസ് യാർഡിൽ ടേൺറൗണ്ട് റേക്ക് വൈകി.'
  },
  'Standing at outer approach signal before junction': {
    EN: 'Standing at outer approach signal before junction',
    HI: 'जंक्शन से पहले आउटर अप्रोच सिग्नल पर रुकी हुई है',
    TA: 'சந்திப்புக்கு முன் வெளிப்புற அணுகுமுறை சிக்னலில் நிற்கிறது',
    TE: 'జంక్షన్‌కు ముందు ఔటర్ అప్రోచ్ సిగ్నల్ వద్ద ఆగింది',
    ML: 'ജംഗ്ഷന് മുമ്പ് ഔട്ടർ അപ്രോച്ച് സിഗ്നലിൽ നിർത്തിയിട്ടിരിക്കുന്നു'
  },
  'Single-line freight clearance & yard junction hold': {
    EN: 'Single-line freight clearance & yard junction hold',
    HI: 'सिंगल लाइन मालगाड़ी क्लीयरेंस और यार्ड जंक्शन होल्ड',
    TA: 'ஒற்றை பாதை சரக்கு அனுமதி மற்றும் யார்டு சந்திப்பு நிறுத்தம்',
    TE: 'సింగిల్ లైన్ సరుకు క్లియరెన్స్ & యార్డ్ జంక్షన్ హోల్డ్',
    ML: 'സിംഗിൾ ലൈൻ ചരക്ക് ക്ലിയറൻസും യാർഡ് ജംഗ്ഷൻ ഹോൾഡും'
  },
  'Dense freight intersection & signal interlocking': {
    EN: 'Dense freight intersection & signal interlocking',
    HI: 'घना मालगाड़ी इंटरसेक्शन और सिग्नल इंटरलॉकिंग',
    TA: 'அடர்த்தியான சரக்கு சந்திப்பு மற்றும் சிக்னல் இன்டர்லாக்கிங்',
    TE: 'సాంద్రమైన సరుకు ఇంటర్‌సెక్షన్ & సిగ్నల్ ఇంటర్‌లాకింగ్',
    ML: 'തിരക്കേറിയ ചരക്ക് ഇന്റർസെക്ഷനും സിഗ്നൽ ഇന്റർലോക്കിംഗും'
  },
  'Speed restriction over curve section': {
    EN: 'Speed restriction over curve section',
    HI: 'घुमावदार मोड़ पर गति प्रतिबंध',
    TA: 'வளைவுப் பகுதியில் வேகக் கட்டுப்பாடு',
    TE: 'మలుపు విభాగంపై వేగ పరిమితి',
    ML: 'വളവ് വിഭാഗത്തിൽ വേഗത നിയന്ത്രണം'
  },
  'Semi-high speed cleared corridor': {
    EN: 'Semi-high speed cleared corridor',
    HI: 'सेमी-हाई स्पीड क्लीयर्ड कॉरिडोर',
    TA: 'அதிவேக அனுமதிக்கப்பட்ட வழித்தடம்',
    TE: 'సెమీ-హై స్పీడ్ క్లియర్ చేయబడిన కారిడార్',
    ML: 'സെമി-ഹൈ സ്പീഡ് ക്ലിയർ ചെയ്ത ഇടനാഴി'
  },
  'Currently between Moradabad Jn and Bareilly Jn': {
    EN: 'Currently between Moradabad Jn and Bareilly Jn',
    HI: 'वर्तमान में मुरादाबाद जंक्शन और बरेली जंक्शन के बीच',
    TA: 'தற்போது மொராதாபாத் மற்றும் பரேலி சந்திப்புகளுக்கு இடையே உள்ளது',
    TE: 'ప్రస్తుతం మొరాదాబాద్ మరియు బరేలీ జంక్షన్ల మధ్య ఉంది',
    ML: 'നിലവിൽ മൊറാദാബാദ്, ബറേലി ജംഗ്ഷനുകൾക്ക് ഇടയിൽ'
  },
  'Currently near Ratlam Jn approaching Kota': {
    EN: 'Currently near Ratlam Jn approaching Kota',
    HI: 'वर्तमान में रतलाम जंक्शन के पास, कोटा की ओर अग्रसर',
    TA: 'தற்போது ரத்லாம் சந்திப்பு அருகில், கோட்டாவை நோக்கிச் செல்கிறது',
    TE: 'ప్రస్తుతం రత్లాం జంక్షన్ సమీపంలో కోటా వైపు వెళ్తోంది',
    ML: 'നിലവിൽ രത്‌ലാം ജംഗ്ഷന് സമീപം, കോട്ടയിലേക്ക് അടുക്കുന്നു'
  },
  'Currently near Wardha Jn entering Nagpur section': {
    EN: 'Currently near Wardha Jn entering Nagpur section',
    HI: 'वर्तमान में वर्धा जंक्शन के पास, नागपुर रेल खंड में प्रवेश',
    TA: 'தற்போது வர்தா சந்திப்பு அருகில், நாக்பூர் பிரிவுக்குள் நுழைகிறது',
    TE: 'ప్రస్తుతం వర్ధా జంక్షన్ సమీపంలో నాగ్‌పూర్ సెక్షన్‌లోకి ప్రవేశిస్తోంది',
    ML: 'നിലവിൽ വർദ്ധാ ജംഗ്ഷന് സമീപം, നാഗ്പൂർ സെക്ഷനിലേക്ക് പ്രവേശിക്കുന്നു'
  },
  'Currently near Vijayawada Jn awaiting line clearance': {
    EN: 'Currently near Vijayawada Jn awaiting line clearance',
    HI: 'वर्तमान में विजयवाड़ा जंक्शन के पास, लाइन क्लियरेंस की प्रतीक्षा में',
    TA: 'தற்போது விஜயவாடா சந்திப்பு அருகில், பாதை அனுமதிக்காக காத்திருக்கிறது',
    TE: 'ప్రస్తుతం విజయవాడ జంక్షన్ సమీపంలో లైన్ క్లియరెన్స్ కోసం వేచి ఉంది',
    ML: 'നിലവിൽ വിജയവാഡ ജംഗ്ഷന് സമീപം, ലൈൻ ക്ലിയറൻസിനായി കാത്തിരിക്കുന്നു'
  },
  'No congestion reported on the Moradabad–Bareilly stretch. Historical average delay at this section is under 3 minutes for this train.': {
    EN: 'No congestion reported on the Moradabad–Bareilly stretch. Historical average delay at this section is under 3 minutes for this train.',
    HI: 'मुरादाबाद-बरेली खंड पर कोई जाम नहीं है। इस ट्रेन के लिए इस खंड पर ऐतिहासिक औसत देरी 3 मिनट से कम है।',
    TA: 'மொராதாபாத்–பரேலி பாதையில் நெரிசல் இல்லை. இந்த ரயிலுக்கு இந்த பிரிவில் சராசரி தாமதம் 3 நிமிடங்களுக்கும் குறைவு.',
    TE: 'మొరాదాబాద్-బరేలీ మార్గంలో రద్దీ లేదు. ఈ రైలుకు ఈ విభాగంలో చారిత్రక సగటు ఆలస్యం 3 నిమిషాల కంటే తక్కువ.',
    ML: 'മൊറാദാബാദ്-ബറേലി റൂട്ടിൽ ട്രാഫിക് തടസ്സമില്ല. ഈ ട്രെയിനിന് ഈ സെക്ഷനിലെ ശരാശരി കാലതാമസം 3 മിനിറ്റിൽ താഴെയാണ്.'
  },
  'Minor track speed restriction near Ratlam junction (-15 km/h limit). High section clearance scheduled past Kota will recover 6 minutes.': {
    EN: 'Minor track speed restriction near Ratlam junction (-15 km/h limit). High section clearance scheduled past Kota will recover 6 minutes.',
    HI: 'रतलाम जंक्शन के पास ट्रैक गति प्रतिबंध (-15 किमी/घंटा)। कोटा के बाद निर्धारित उच्च गति से 6 मिनट की भरपाई होगी।',
    TA: 'ரத்லாம் சந்திப்பு அருகில் சிறிய வேகக் கட்டுப்பாடு (-15 கி.மீ/மணி). கோட்டாவிற்குப் பின் 6 நிமிடங்கள் மீட்டெடுக்கப்படும்.',
    TE: 'రత్లాం జంక్షన్ సమీపంలో వేగ పరిమితి (-15 కి.మీ/గం). కోటా దాటిన తర్వాత 6 నిమిషాలు రికవర్ అవుతుంది.',
    ML: 'രത്‌ലാം ജംഗ്ഷന് സമീപം വേഗത നിയന്ത്രണം (-15 കി.മീ/മണിക്കൂർ). കോട്ട കഴിഞ്ഞാൽ 6 മിനിറ്റ് സമയം വീണ്ടെടുക്കും.'
  },
  'Heavy freight train precedence observed in Wardha–Nagpur block. Historical delay averages 22 minutes during night hours.': {
    EN: 'Heavy freight train precedence observed in Wardha–Nagpur block. Historical delay averages 22 minutes during night hours.',
    HI: 'वर्धा-नागपुर खंड में मालगाड़ियों को प्राथमिकता के कारण ठहराव। रात के समय ऐतिहासिक औसत देरी 22 मिनट है।',
    TA: 'வர்தா–நாக்பூர் பகுதியில் சரக்கு ரயில்களுக்கு முன்னுரிமை அளிக்கப்பட்டது. இரவு நேரங்களில் சராசரி தாமதம் 22 நிமிடங்கள்.',
    TE: 'వర్ధా-నాగ్‌పూర్ బ్లాక్‌లో గూడ్స్ రైళ్లకు ప్రాధాన్యత ఇవ్వబడింది. రాత్రి వేళల్లో సగటు ఆలస్యం 22 నిమిషాలు.',
    ML: 'വർദ്ധാ-നാഗ്പൂർ റൂട്ടിൽ ചരക്ക് ട്രെയിനുകൾക്ക് മുൻഗണന നൽകിയിരിക്കുന്നു. രാത്രിയിലെ ശരാശരി കാലതാമസം 22 മിനിറ്റാണ്.'
  },
  'Single-line clearance delay compounding between Vijayawada and Ongole. Historically averages over 2 hours delay due to freight corridor crossing.': {
    EN: 'Single-line clearance delay compounding between Vijayawada and Ongole. Historically averages over 2 hours delay due to freight corridor crossing.',
    HI: 'विजयवाड़ा और ओंगोल के बीच सिंगल-लाइन क्लीयरेंस के कारण भारी देरी। मालगाड़ी क्रॉसिंग के कारण ऐतिहासिक रूप से 2 घंटे से अधिक की देरी होती है।',
    TA: 'விஜயவாடா மற்றும் ஒங்கோல் இடையே ஒற்றை ரயில் பாதை அனுமதி தாமதம். சரக்கு ரயில் கடந்து செல்வதால் சராசரியாக 2 மணி நேரத்திற்கும் மேல் தாமதமாகிறது.',
    TE: 'విజయవాడ మరియు ఒంగోలు మధ్య సింగిల్-లైన్ క్లియరెన్స్ ఆలస్యం. సరుకు రవాణా రైళ్ల క్రాసింగ్ వల్ల 2 గంటలకు పైగా ఆలస్యం జరుగుతుంది.',
    ML: 'വിജയവാഡയ്ക്കും ഒങ്കോളിനും ഇടയിലുള്ള സിംഗിൾ ലൈൻ ക്ലിയറൻസ് കാലതാമസം. ചരക്ക് ട്രെയിനുകൾ കാരണം ശരാശരി 2 മണിക്കൂറിലധികം കാലതാമസം ഉണ്ടാകുന്നു.'
  },
  'Clear corridor; green-wave automatic block signaling': {
    EN: 'Clear corridor; green-wave automatic block signaling',
    HI: 'साफ कॉरिडोर; ग्रीन-वेव ऑटोमैटिक ब्लॉक सिग्नलिंग',
    TA: 'தெளிவான வழித்தடம்; கிரீன்-வேவ் தானியங்கி பிளாக் சிக்னலிங்',
    TE: 'స్పష్టమైన కారిడార్; గ్రీన్-వేవ్ ఆటోమేటిక్ బ్లాక్ సిగ్నలింగ్',
    ML: 'വ്യക്തമായ ഇടനാഴി; ഗ്രീൻ-വേവ് ഓട്ടോമാറ്റിക് ബ്ലോക്ക് സിഗ്നലിംഗ്'
  },
  'Automated verification test report': {
    EN: 'Automated verification test report',
    HI: 'स्वचालित सत्यापन परीक्षण रिपोर्ट',
    TA: 'தானியங்கி சரிபார்ப்பு சோதனை அறிக்கை',
    TE: 'స్వయంచాలక ధృవీకరణ పరీక్ష నివేదిక',
    ML: 'യാന്ത്രിക പരിശോധന ടെസ്റ്റ് റിപ്പോർട്ട്'
  },
  'Pre-departure track clearance in progress; scheduled origin': {
    EN: 'Pre-departure track clearance in progress; scheduled origin',
    HI: 'प्रस्थान-पूर्व ट्रैक क्लीयरेंस प्रगति पर; निर्धारित मूल स्टेशन',
    TA: 'புறப்படுவதற்கு முந்தைய பாதை அனுமதி செயலில் உள்ளது; திட்டமிடப்பட்ட ஆரம்பம்',
    TE: 'బయలుదేరడానికి ముందు ట్రాక్ క్లియరెన్స్ పురోగతిలో ఉంది; షెడ్యూల్ చేసిన మూలం',
    ML: 'പുറപ്പെടുന്നതിന് മുമ്പുള്ള ട്രാക്ക് ക്ലിയറൻസ് പുരോഗതിയിലാണ്; നിശ്ചയിച്ച ആരംഭം'
  },
  'No congestion reported on the corridor.': {
    EN: 'No congestion reported on the corridor.',
    HI: 'इस कॉरिडोर पर किसी भी प्रकार के जाम की सूचना नहीं है।',
    TA: 'வழித்தடத்தில் நெரிசல் எதுவும் பதிவாகவில்லை.',
    TE: 'కారిడార్‌లో ఎలాంటి రద్దీ నివేదించబడలేదు.',
    ML: 'ഇടനാഴിയിൽ ട്രാഫിക് തടസ്സങ്ങളൊന്നും റിപ്പോർട്ട് ചെയ്തിട്ടില്ല.'
  }
};

// Train name dictionary for all languages (train numbers are strictly preserved in English digits)
export const TRAIN_NAME_TRANSLATIONS: Record<string, Record<Language, { short: string; full: string; fullRoute: string }>> = {
  '22490': {
    EN: { short: 'Vande Bharat', full: 'Vande Bharat Express', fullRoute: 'Vande Bharat: Meerut → Varanasi' },
    HI: { short: 'वंदे भारत', full: 'वंदे भारत एक्सप्रेस', fullRoute: 'वंदे भारत: मेरठ → वाराणसी' },
    TA: { short: 'வந்தே பாரத்', full: 'வந்தே பாரத் எக்ஸ்பிரஸ்', fullRoute: 'வந்தே பாரத்: மீரட் → வாரணாசி' },
    TE: { short: 'వందే భారత్', full: 'వందే భారత్ ఎక్స్‌ప్రెస్', fullRoute: 'వందే భారత్: మీరట్ → వారణాసి' },
    ML: { short: 'വന്ദേ ഭാരത്', full: 'വന്ദേ ഭാരത് എക്സ്പ്രസ്', fullRoute: 'വന്ദേ ഭാരത്: മീററ്റ് → വാരാണസി' }
  },
  '12951': {
    EN: { short: 'Mumbai Rajdhani', full: 'Mumbai Tejas Rajdhani', fullRoute: 'Mumbai Rajdhani: Mumbai → New Delhi' },
    HI: { short: 'मुंबई राजधानी', full: 'मुंबई तेजस राजधानी', fullRoute: 'मुंबई राजधानी: मुंबई → नई दिल्ली' },
    TA: { short: 'மும்பை ராஜ்தானி', full: 'மும்பை தேஜஸ் ராஜ்தானி', fullRoute: 'மும்பை ராஜ்தானி: மும்பை → புது தில்லி' },
    TE: { short: 'ముంబై రాజధాని', full: 'ముంబై తేజస్ రాజధాని', fullRoute: 'ముంబై రాజధాని: ముంబై → న్యూఢిల్లీ' },
    ML: { short: 'മുംബൈ രാജധാനി', full: 'മുംബൈ തേജസ് രാജധാനി', fullRoute: 'മുംബൈ രാജധാനി: മുംബൈ → ന്യൂഡൽഹി' }
  },
  '12615': {
    EN: { short: 'GT Express', full: 'Grand Trunk Express', fullRoute: 'Grand Trunk Express: New Delhi → Chennai' },
    HI: { short: 'ग्रैंड ट्रंक एक्सप्रेस', full: 'ग्रैंड ट्रंक एक्सप्रेस', fullRoute: 'ग्रैंड ट्रंक एक्सप्रेस: नई दिल्ली → चेन्नई' },
    TA: { short: 'ஜிடி எக்ஸ்பிரஸ்', full: 'கிராண்ட் ட்ரங்க் எக்ஸ்பிரஸ்', fullRoute: 'கிராண்ட் ட்ரங்க் எக்ஸ்பிரஸ்: புது தில்லி → சென்னை' },
    TE: { short: 'జిటి ఎక్స్‌ప్రెస్', full: 'గ్రాండ్ ట్రంక్ ఎక్స్‌ప్రెస్', fullRoute: 'గ్రాండ్ ట్రంక్ ఎక్స్‌ప్రెస్: న్యూఢిల్లీ → చెన్నై' },
    ML: { short: 'ജിടി எക്സ്പ്രസ്', full: 'ഗ്രാൻഡ് ട്രങ്ക് എക്സ്പ്രസ്', fullRoute: 'ഗ്രാൻഡ് ട്രങ്ക് എക്സ്പ്രസ്: ന്യൂഡൽഹി → ചെന്നൈ' }
  },
  '22536': {
    EN: { short: 'Manduadih Exp', full: 'Manduadih–Rameswaram Express', fullRoute: 'Manduadih Express: Banaras → Rameswaram' },
    HI: { short: 'मंडुवाडीह एक्सप्रेस', full: 'मंडुवाडीह-रामेश्वरम एक्सप्रेस', fullRoute: 'मंडुवाडीह एक्सप्रेस: बनारस → रामेश्वरम' },
    TA: { short: 'மண்டுவாடி எக்ஸ்பிரஸ்', full: 'மண்டுவாடி–இராமேஸ்வரம் எக்ஸ்பிரஸ்', fullRoute: 'மண்டுவாடி எக்ஸ்பிரஸ்: பனாரஸ் → இராமேஸ்வரம்' },
    TE: { short: 'మండువాడీ ఎక్స్‌ప్రెస్', full: 'మండువాడీ–రామేశ్వరం ఎక్స్‌ప్రెస్', fullRoute: 'మండువాడీ ఎక్స్‌ప్రెస్: బనారస్ → రామేశ్వరం' },
    ML: { short: 'മണ്ഡുവാഡിഹ് എക്സ്പ്രസ്', full: 'മണ്ഡുവാഡിഹ്-രാമേശ്വരം എക്സ്പ്രസ്', fullRoute: 'മണ്ഡുവാഡിഹ് എക്സ്പ്രസ്: ബനാറസ് → രാമേശ്വരം' }
  },
  '12004': {
    EN: { short: 'Lucknow Shatabdi', full: 'Lucknow Shatabdi Express', fullRoute: 'Lucknow Shatabdi: New Delhi → Lucknow' },
    HI: { short: 'लखनऊ शताब्दी', full: 'लखनऊ शताब्दी एक्सप्रेस', fullRoute: 'लखनऊ शताब्दी: नई दिल्ली → लखनऊ' },
    TA: { short: 'லக்னோ சதாப்தி', full: 'லக்னோ சதாப்தி எக்ஸ்பிரஸ்', fullRoute: 'லக்னோ சதாப்தி: புது தில்லி → லக்னோ' },
    TE: { short: 'లక్నో శతాబ్ది', full: 'లక్నో శతాబ్ది ఎక్స్‌ప్రెస్', fullRoute: 'లక్నో శతాబ్ది: న్యూఢిల్లీ → లక్నో' },
    ML: { short: 'ലഖ്‌നൗ ശതാബ്ദി', full: 'ലഖ്‌നൗ ശതാബ്ദി എക്സ്പ്രസ്', fullRoute: 'ലഖ്‌നൗ ശതാബ്ദി: ന്യൂഡൽഹി → ലഖ്‌നൗ' }
  },
  '12625': {
    EN: { short: 'Kerala Express', full: 'Kerala Superfast Express', fullRoute: 'Kerala Express: Trivandrum → New Delhi' },
    HI: { short: 'केरल एक्सप्रेस', full: 'केरल सुपरफास्ट एक्सप्रेस', fullRoute: 'केरल एक्सप्रेस: त्रिवेंद्रम → नई दिल्ली' },
    TA: { short: 'கேரளா எக்ஸ்பிரஸ்', full: 'கேரளா சூப்பர்பாஸ்ட் எக்ஸ்பிரஸ்', fullRoute: 'கேரளா எக்ஸ்பிரஸ்: திருவனந்தபுரம் → புது தில்லி' },
    TE: { short: 'కేరళ ఎక్స్‌ప్రెస్', full: 'కేరళ సూపర్ ఫాస్ట్ ఎక్స్‌ప్రెస్', fullRoute: 'కేరళ ఎక్స్‌ప్రెస్: త్రివేండ్రం → న్యూఢిల్లీ' },
    ML: { short: 'കേരള എക്സ്പ്രസ്', full: 'കേരള സൂപ്പർഫാസ്റ്റ് എക്സ്പ്രസ്', fullRoute: 'കേരള എക്സ്പ്രസ്: തിരുവനന്തപുരം → ന്യൂഡൽഹി' }
  },
  '12301': {
    EN: { short: 'Howrah Rajdhani', full: 'Howrah Rajdhani Express', fullRoute: 'Howrah Rajdhani: Howrah → New Delhi' },
    HI: { short: 'हावड़ा राजधानी', full: 'हावड़ा राजधानी एक्सप्रेस', fullRoute: 'हावड़ा राजधानी: हावड़ा → नई दिल्ली' },
    TA: { short: 'ஹவுரா ராஜ்தானி', full: 'ஹவுரா ராஜ்தானி எக்ஸ்பிரஸ்', fullRoute: 'ஹவுரா ராஜ்தானி: ஹவுரா → புது தில்லி' },
    TE: { short: 'హౌరా రాజధాని', full: 'హౌరా రాజధాని ఎక్స్‌ప్రెస్', fullRoute: 'హౌరా రాజధాని: హౌరా → న్యూఢిల్లీ' },
    ML: { short: 'ഹൗറ രാജധാനി', full: 'ഹൗറ രാജധാനി എക്സ്പ്രസ്', fullRoute: 'ഹൗറ രാജധാനി: ഹൗറ → ന്യൂഡൽഹി' }
  },
  '12002': {
    EN: { short: 'Bhopal Shatabdi', full: 'New Delhi–Bhopal Shatabdi Express', fullRoute: 'Bhopal Shatabdi: New Delhi → Rani Kamlapati' },
    HI: { short: 'भोपाल शताब्दी', full: 'भोपाल शताब्दी एक्सप्रेस', fullRoute: 'भोपाल शताब्दी: नई दिल्ली → रानी कमलापति' },
    TA: { short: 'போபால் சதாப்தி', full: 'போபால் சதாப்தி எக்ஸ்பிரஸ்', fullRoute: 'போபால் சதாப்தி: புது தில்லி → ராணி கமலாபதி' },
    TE: { short: 'భోపాల్ శతాబ్ది', full: 'భోపాల్ శతాబ్ది ఎక్స్‌ప్రెస్', fullRoute: 'భోపాల్ శతాబ్ది: న్యూఢిల్లీ → రాణి కమలాపతి' },
    ML: { short: 'ഭോപ്പാൽ ശതാബ്ദി', full: 'ഭോപ്പാൽ ശതാബ്ദി എക്സ്പ്രസ്', fullRoute: 'ഭോപ്പാൽ ശതാബ്ദി: ന്യൂഡൽഹി → റാണി കമലാപതി' }
  },
  '12723': {
    EN: { short: 'Telangana Express', full: 'Telangana Superfast Express', fullRoute: 'Telangana Express: Hyderabad → New Delhi' },
    HI: { short: 'तेलंगाना एक्सप्रेस', full: 'तेलंगाना सुपरफास्ट एक्सप्रेस', fullRoute: 'तेलंगाना एक्सप्रेस: हैदराबाद → नई दिल्ली' },
    TA: { short: 'தெலங்கானா எக்ஸ்பிரஸ்', full: 'தெலங்கானா சூப்பர்பாஸ்ட் எக்ஸ்பிரஸ்', fullRoute: 'தெலங்கானா எக்ஸ்பிரஸ்: ஹைதராபாத் → புது தில்லி' },
    TE: { short: 'తెలంగాణ ఎక్స్‌ప్రెస్', full: 'తెలంగాణ సూపర్ ఫాస్ట్ ఎక్స్‌ప్రెస్', fullRoute: 'తెలంగాణ ఎక్స్‌ప్రెస్: హైదరాబాద్ → న్యూఢిల్లీ' },
    ML: { short: 'തെലങ്കാന എക്സ്പ്രസ്', full: 'തെലങ്കാന സൂപ്പർഫാസ്റ്റ് എക്സ്പ്രസ്', fullRoute: 'തെലങ്കാന എക്സ്പ്രസ്: ഹൈദരാബാദ് → ന്യൂഡൽഹി' }
  },
  '12839': {
    EN: { short: 'Howrah–Chennai Mail', full: 'Howrah–Chennai Superfast Mail', fullRoute: 'Howrah–Chennai Mail: Howrah → Chennai Central' },
    HI: { short: 'हावड़ा-चेन्नई मेल', full: 'हावड़ा-चेन्नई सुपरफास्ट मेल', fullRoute: 'हावड़ा-चेन्नई मेल: हावड़ा → चेन्नई सेंट्रल' },
    TA: { short: 'ஹவுரா–சென்னை மெயில்', full: 'ஹவுரா–சென்னை சூப்பர்பாஸ்ட் மெயில்', fullRoute: 'ஹவுரா–சென்னை மெயில்: ஹவுரா → சென்னை சென்ட்ரல்' },
    TE: { short: 'హౌరా–చెన్నై మెయిల్', full: 'హౌరా–చెన్నై సూపర్ ఫాస్ట్ మెయిల్', fullRoute: 'హౌరా–చెన్నై మెయిల్: హౌరా → చెన్నై సెంట్రల్' },
    ML: { short: 'ഹൗറ–ചെന്നൈ മെയിൽ', full: 'ഹൗറ–ചെന്നൈ സൂപ്പർഫാസ്റ്റ് മെയിൽ', fullRoute: 'ഹൗറ–ചെന്നൈ മെയിൽ: ഹൗറ → ചെന്നൈ സെൻട്രൽ' }
  },
  '12903': {
    EN: { short: 'Golden Temple Mail', full: 'Golden Temple Superfast Mail', fullRoute: 'Golden Temple Mail: Mumbai Central → Amritsar' },
    HI: { short: 'गोल्डन टेम्पल मेल', full: 'गोल्डन टेम्पल सुपरफास्ट मेल', fullRoute: 'गोल्डन टेम्पल मेल: मुंबई सेंट्रल → अमृतसर' },
    TA: { short: 'கோல்டன் டெம்பிள் மெயில்', full: 'கோல்டன் டெம்பிள் சூப்பர்பாஸ்ட் மெயில்', fullRoute: 'கோல்டன் டெம்பிள் மெயில்: மும்பை சென்ட்ரல் → அமிர்தசரஸ்' },
    TE: { short: 'గోల్డెన్ టెంపుల్ మెయిల్', full: 'గోల్డెన్ టెంపుల్ సూపర్ ఫాస్ట్ మెయిల్', fullRoute: 'గోల్డెన్ టెంపుల్ మెయిల్: ముంబై సెంట్రల్ → అమృత్‌సర్' },
    ML: { short: 'ഗോൾഡൻ ടെമ്പിൾ മെയിൽ', full: 'ഗോൾഡൻ ടെമ്പിൾ സൂപ്പർഫാസ്റ്റ് മെയിൽ', fullRoute: 'ഗോൾഡൻ ടെമ്പിൾ മെയിൽ: മുംബൈ സെൻട്രൽ → അമൃത്സർ' }
  },
  '12137': {
    EN: { short: 'Punjab Mail', full: 'Punjab Superfast Mail', fullRoute: 'Punjab Mail: Mumbai CSMT → Firozpur Cantt' },
    HI: { short: 'पंजाब मेल', full: 'पंजाब सुपरफास्ट मेल', fullRoute: 'पंजाब मेल: मुंबई सीएसएमटी → फिरोजपुर कैंट' },
    TA: { short: 'பஞ்சாப் மெயில்', full: 'பஞ்சாப் சூப்பர்பாஸ்ட் மெயில்', fullRoute: 'பஞ்சாப் மெயில்: மும்பை சி.எஸ்.எம்.டி → பிரோஸ்பூர் கன்ட்' },
    TE: { short: 'పంజాబ్ మెయిల్', full: 'పంజాబ్ సూపర్ ఫాస్ట్ మెయిల్', fullRoute: 'పంజాబ్ మెయిల్: ముంబై సిఎస్ఎంటి → ఫిరోజ్‌పూర్ కాంట్' },
    ML: { short: 'പഞ്ചാബ് മെയിൽ', full: 'പഞ്ചാബ് സൂപ്പർഫാസ്റ്റ് മെയിൽ', fullRoute: 'പഞ്ചാബ് മെയിൽ: മുംബൈ സി.എസ്.എം.ടി → ഫിറോസ്പൂർ കാൻ്റ്' }
  },
  '16031': {
    EN: { short: 'Andaman Express', full: 'Andaman Express', fullRoute: 'Andaman Express: Chennai Central → Shri Mata Vaishno Devi Katra' },
    HI: { short: 'अंडमान एक्सप्रेस', full: 'अंडमान एक्सप्रेस', fullRoute: 'अंडमान एक्सप्रेस: चेन्नई सेंट्रल → श्री माता वैष्णो देवी कटरा' },
    TA: { short: 'அந்தமான் எக்ஸ்பிரஸ்', full: 'அந்தமான் எக்ஸ்பிரஸ்', fullRoute: 'அந்தமான் எக்ஸ்பிரஸ்: சென்னை சென்ட்ரல் → ஸ்ரீ மாதா வைஷ்ணோ தேவி கத்ரா' },
    TE: { short: 'అండమాన్ ఎక్స్‌ప్రెస్', full: 'అండమాన్ ఎక్స్‌ప్రెస్', fullRoute: 'అండమాన్ ఎక్స్‌ప్రెస్: చెన్నై సెంట్రల్ → శ్రీ మాతా వైష్ణో దేవి కట్రా' },
    ML: { short: 'ആൻഡമാൻ എക്സ്പ്രസ്', full: 'ആൻഡമാൻ എക്സ്പ്രസ്', fullRoute: 'ആൻഡമാൻ എക്സ്പ്രസ്: ചെന്നൈ സെൻട്രൽ → ശ്രീ മാതാ വൈഷ്ണോ ദേവി കത്ര' }
  },
  '12801': {
    EN: { short: 'Purushottam Exp', full: 'Purushottam Superfast Express', fullRoute: 'Purushottam Express: Puri → New Delhi' },
    HI: { short: 'पुरुषोत्तम एक्सप्रेस', full: 'पुरुषोत्तम सुपरफास्ट एक्सप्रेस', fullRoute: 'पुरुषोत्तम एक्सप्रेस: पुरी → नई दिल्ली' },
    TA: { short: 'புருஷோத்தம் எக்ஸ்பிரஸ்', full: 'புருஷோத்தம் சூப்பர்பாஸ்ட் எக்ஸ்பிரஸ்', fullRoute: 'புருஷோத்தம் எக்ஸ்பிரஸ்: புரி → புது தில்லி' },
    TE: { short: 'పురుషోత్తమ్ ఎక్స్‌ప్రెస్', full: 'పురుషోత్తమ్ సూపర్ ఫాస్ట్ ఎక్స్‌ప్రెస్', fullRoute: 'పురుషోత్తమ్ ఎక్స్‌ప్రెస్: పూరి → న్యూఢిల్లీ' },
    ML: { short: 'പുരുഷോത്തം എക്സ്പ്രസ്', full: 'പുരുഷോത്തം സൂപ്പർഫാസ്റ്റ് എക്സ്പ്രസ്', fullRoute: 'പുരുഷോത്തം എക്സ്പ്രസ്: പുരി → ന്യൂഡൽഹി' }
  },
  '12649': {
    EN: { short: 'Karnataka Sampark Kranti', full: 'Karnataka Sampark Kranti Express', fullRoute: 'Karnataka Sampark Kranti: Yesvantpur → Hazrat Nizamuddin' },
    HI: { short: 'कर्नाटक संपर्क क्रांति', full: 'कर्नाटक संपर्क क्रांति एक्सप्रेस', fullRoute: 'कर्नाटक संपर्क क्रांति: यशवंतपुर → हजरत निजामुद्दीन' },
    TA: { short: 'கர்நாடக சம்பார்க் கிராந்தி', full: 'கர்நாடக சம்பார்க் கிராந்தி எக்ஸ்பிரஸ்', fullRoute: 'கர்நாடக சம்பார்க் கிராந்தி: யஷ்வந்த்பூர் → ஹசரத் நிஜாமுதீன்' },
    TE: { short: 'కర్ణాటక సంపర్క్ క్రాంతి', full: 'కర్ణాటక సంపర్క్ క్రాంతి ఎక్స్‌ప్రెస్', fullRoute: 'కర్ణాటక సంపర్క్ క్రాంతి: యశ్వంతపూర్ → హజ్రత్ నిజాముద్దీన్' },
    ML: { short: 'കർണാടക സമ്പർക്ക് ക്രാന്തി', full: 'കർണാടക സമ്പർക്ക് ക്രാന്തി എക്സ്പ്രസ്', fullRoute: 'കർണാടക സമ്പർക്ക് ക്രാന്തി: യശ്വന്ത്പൂർ → ഹസ്രത്ത് നിസാമുദ്ദീൻ' }
  },
  '12267': {
    EN: { short: 'Mumbai–Ahmedabad Duronto', full: 'Mumbai Central–Ahmedabad AC Duronto Express', fullRoute: 'Mumbai–Ahmedabad Duronto: Mumbai Central → Ahmedabad' },
    HI: { short: 'मुंबई-अहमदाबाद दुरंतो', full: 'मुंबई सेंट्रल-अहमदाबाद एसी दुरंतो एक्सप्रेस', fullRoute: 'मुंबई-अहमदाबाद दुरंतो: मुंबई सेंट्रल → अहमदाबाद' },
    TA: { short: 'மும்பை–அகமதாபாத் துரந்தோ', full: 'மும்பை சென்ட்ரல்–அகமதாபாத் ஏசி துரந்தோ எக்ஸ்பிரஸ்', fullRoute: 'மும்பை–அகமதாபாத் துரந்தோ: மும்பை சென்ட்ரல் → அகமதாபாத்' },
    TE: { short: 'ముంబై–అహ్మదాబాద్ దురంతో', full: 'ముంబై సెంట్రల్–అహ్మదాబాద్ ఎసి దురంతో ఎక్స్‌ప్రెస్', fullRoute: 'ముంబై–అహ్మదాబాద్ దురంతో: ముంబై సెంట్రల్ → అహ్మదాబాద్' },
    ML: { short: 'മുംബൈ–അഹമ്മദാബാദ് ദുരന്തോ', full: 'മുംബൈ സെൻട്രൽ–അഹമ്മദാബാദ് എസി ദുരന്തോ എക്സ്പ്രസ്', fullRoute: 'മുംബൈ–അഹമ്മദാബാദ് ദുരന്തോ: മുംബൈ സെൻട്രൽ → അഹമ്മദാബാദ്' }
  },
  '22691': {
    EN: { short: 'Bengaluru Rajdhani', full: 'Bengaluru Rajdhani Express', fullRoute: 'Bengaluru Rajdhani: KSR Bengaluru → Hazrat Nizamuddin' },
    HI: { short: 'बेंगलुरु राजधानी', full: 'बेंगलुरु राजधानी एक्सप्रेस', fullRoute: 'बेंगलुरु राजधानी: केएसआर बेंगलुरु → हजरत निजामुद्दीन' },
    TA: { short: 'பெங்களூரு ராஜ்தானி', full: 'பெங்களூரு ராஜ்தானி எக்ஸ்பிரஸ்', fullRoute: 'பெங்களூரு ராஜ்தானி: கே.எஸ்.ஆர் பெங்களூரு → ஹசரத் நிஜாமுதீன்' },
    TE: { short: 'బెంగళూరు రాజధాని', full: 'బెంగళూరు రాజధాని ఎక్స్‌ప్రెస్', fullRoute: 'బెంగళూరు రాజధాని: కేఎస్ఆర్ బెంగళూరు → హజ్రత్ నిజాముద్దీన్' },
    ML: { short: 'ബെംഗളൂരു രാജധാനി', full: 'ബെംഗളൂരു രാജധാനി എക്സ്പ്രസ്', fullRoute: 'ബെംഗളൂരു രാജധാനി: കെഎസ്ആർ ബെംഗളൂരു → ഹസ്രത്ത് നിസാമുദ്ദീൻ' }
  },
  '12273': {
    EN: { short: 'Howrah–New Delhi Duronto', full: 'Howrah–New Delhi AC Duronto Express', fullRoute: 'Howrah–New Delhi Duronto: Howrah → New Delhi' },
    HI: { short: 'हावड़ा-नई दिल्ली दुरंतो', full: 'हावड़ा-नई दिल्ली एसी दुरंतो एक्सप्रेस', fullRoute: 'हावड़ा-नई दिल्ली दुरंतो: हावड़ा → नई दिल्ली' },
    TA: { short: 'ஹவுரா–புது தில்லி துரந்தோ', full: 'ஹவுரா–புது தில்லி ஏசி துரந்தோ எக்ஸ்பிரஸ்', fullRoute: 'ஹவுரா–புது தில்லி துரந்தோ: ஹவுரா → புது தில்லி' },
    TE: { short: 'హౌరా–న్యూఢిల్లీ దురంతో', full: 'హౌరా–న్యూఢిల్లీ ఎసి దురంతో ఎక్స్‌ప్రెస్', fullRoute: 'హౌరా–న్యూఢిల్లీ దురంతో: హౌరా → న్యూఢిల్లీ' },
    ML: { short: 'ഹൗറ–ന്യൂഡൽഹി ദുരന്തോ', full: 'ഹൗറ–ന്യൂഡൽഹി എസി ദുരന്തോ എക്സ്പ്രസ്', fullRoute: 'ഹൗറ–ന്യൂഡൽഹി ദുരന്തോ: ഹൗറ → ന്യൂഡൽഹി' }
  },
  '12009': {
    EN: { short: 'Mumbai–Ahmedabad Shatabdi', full: 'Mumbai Central–Ahmedabad Shatabdi Express', fullRoute: 'Mumbai–Ahmedabad Shatabdi: Mumbai Central → Ahmedabad' },
    HI: { short: 'मुंबई-अहमदाबाद शताब्दी', full: 'मुंबई सेंट्रल-अहमदाबाद शताब्दी एक्सप्रेस', fullRoute: 'मुंबई-अहमदाबाद शताब्दी: मुंबई सेंट्रल → अहमदाबाद' },
    TA: { short: 'மும்பை–அகமதாபாத் சதாப்தி', full: 'மும்பை சென்ட்ரல்–அகமதாபாத் சதாப்தி எக்ஸ்பிரஸ்', fullRoute: 'மும்பை–அகமதாபாத் சதாப்தி: மும்பை சென்ட்ரல் → அகமதாபாத்' },
    TE: { short: 'ముంబై–అహ్మదాబాద్ శతాబ్ది', full: 'ముంబై సెంట్రల్–అహ్మదాబాద్ శతాబ్ది ఎక్స్‌ప్రెస్', fullRoute: 'ముంబై–అహ్మదాబాద్ శతాబ్ది: ముంబై సెంట్రల్ → అహ్మదాబాద్' },
    ML: { short: 'മുംബൈ–അഹമ്മദാബാദ് ശതാബ്ദി', full: 'മുംബൈ സെൻട്രൽ–അഹമ്മദാബാദ് ശതാബ്ദി എക്സ്പ്രസ്', fullRoute: 'മുംബൈ–അഹമ്മദാബാദ് ശതാബ്ദി: മുംബൈ സെൻട്രൽ → അഹമ്മദാബാദ്' }
  },
  '12431': {
    EN: { short: 'Trivandrum Rajdhani', full: 'Thiruvananthapuram Rajdhani Express', fullRoute: 'Trivandrum Rajdhani: Thiruvananthapuram → Hazrat Nizamuddin' },
    HI: { short: 'त्रिवेंद्रम राजधानी', full: 'तिरुवनंतपुरम राजधानी एक्सप्रेस', fullRoute: 'त्रिवेंद्रम राजधानी: तिरुवनंतपुरम → हजरत निजामुद्दीन' },
    TA: { short: 'திருவனந்தபுரம் ராஜ்தானி', full: 'திருவனந்தபுரம் ராஜ்தானி எக்ஸ்பிரஸ்', fullRoute: 'திருவனந்தபுரம் ராஜ்தானி: திருவனந்தபுரம் → ஹசரத் நிஜாமுதீன்' },
    TE: { short: 'త్రివేండ్రం రాజధాని', full: 'తిరువనంతపురం రాజధాని ఎక్స్‌ప్రెస్', fullRoute: 'త్రివేండ్రం రాజధాని: తిరువనంతపురం → హజ్రత్ నిజాముద్దీన్' },
    ML: { short: 'തിരുവനന്തപുരം രാജധാനി', full: 'തിരുവനന്തപുരം രാജധാനി എക്സ്പ്രസ്', fullRoute: 'തിരുവനന്തപുരം രാജധാനി: തിരുവനന്തപുരം → ഹസ്രത്ത് നിസാമുദ്ദീൻ' }
  },
  '12423': {
    EN: { short: 'Dibrugarh Rajdhani', full: 'Dibrugarh Rajdhani Express', fullRoute: 'Dibrugarh Rajdhani: Dibrugarh → New Delhi' },
    HI: { short: 'डिब्रूगढ़ राजधानी', full: 'डिब्रूगढ़ राजधानी एक्सप्रेस', fullRoute: 'डिब्रूगढ़ राजधानी: डिब्रूगढ़ → नई दिल्ली' },
    TA: { short: 'திப்ருகர் ராஜ்தானி', full: 'திப்ருகர் ராஜ்தானி எக்ஸ்பிரஸ்', fullRoute: 'திப்ருகர் ராஜ்தானி: திப்ருகர் → புது தில்லி' },
    TE: { short: 'దిబ్రూగఢ్ రాజధాని', full: 'దిబ్రూగఢ్ రాజధాని ఎక్స్‌ప్రెస్', fullRoute: 'దిబ్రూగఢ్ రాజధాని: దిబ్రూగఢ్ → న్యూఢిల్లీ' },
    ML: { short: 'ദിബ്രുഗഡ് രാജധാനി', full: 'ദിബ്രുഗഡ് രാജധാനി എക്സ്പ്രസ്', fullRoute: 'ദിബ്രുഗഡ് രാജധാനി: ദിബ്രുഗഡ് → ന്യൂഡൽഹി' }
  },
  '12621': {
    EN: { short: 'Tamil Nadu Express', full: 'Tamil Nadu Superfast Express', fullRoute: 'Tamil Nadu Express: Chennai Central → New Delhi' },
    HI: { short: 'तमिलनाडु एक्सप्रेस', full: 'तमिलनाडु सुपरफास्ट एक्सप्रेस', fullRoute: 'तमिलनाडु एक्सप्रेस: चेन्नई सेंट्रल → नई दिल्ली' },
    TA: { short: 'தமிழ்நாடு எக்ஸ்பிரஸ்', full: 'தமிழ்நாடு சூப்பர்பாஸ்ட் எக்ஸ்பிரஸ்', fullRoute: 'தமிழ்நாடு எக்ஸ்பிரஸ்: சென்னை சென்ட்ரல் → புது தில்லி' },
    TE: { short: 'తమిళనాడు ఎక్స్‌ప్రెస్', full: 'తమిళనాడు సూపర్ ఫాస్ట్ ఎక్స్‌ప్రెస్', fullRoute: 'తమిళనాడు ఎక్స్‌ప్రెస్: చెన్నై సెంట్రల్ → న్యూఢిల్లీ' },
    ML: { short: 'തമിഴ്നാട് എക്സ്പ്രസ്', full: 'തമിഴ്നാട് സൂപ്പർഫാസ്റ്റ് എക്സ്പ്രസ്', fullRoute: 'തമിഴ്നാട് എക്സ്പ്രസ്: ചെന്നൈ സെൻട്രൽ → ന്യൂഡൽഹി' }
  },
  '12215': {
    EN: { short: 'Delhi–Bandra Garib Rath', full: 'Delhi Sarai Rohilla–Bandra Terminus Garib Rath Express', fullRoute: 'Delhi–Bandra Garib Rath: Delhi Sarai Rohilla → Bandra Terminus' },
    HI: { short: 'दिल्ली-बांद्रा गरीब रथ', full: 'दिल्ली सराय रोहिल्ला-बांद्रा टर्मिनस गरीब रथ एक्सप्रेस', fullRoute: 'दिल्ली-बांद्रा गरीब रथ: दिल्ली सराय रोहिल्ला → बांद्रा टर्मिनस' },
    TA: { short: 'தில்லி–பாந்த்ரா கரீப் ரத்', full: 'தில்லி சராய் ரோஹில்லா–பாந்த்ரா டெர்மினஸ் கரீப் ரத் எக்ஸ்பிரஸ்', fullRoute: 'தில்லி–பாந்த்ரா கரீப் ரத்: தில்லி சராய் ரோஹில்லா → பாந்த்ரா டெர்மினஸ்' },
    TE: { short: 'ఢిల్లీ–బాంద్రా గరీబ్ రథ్', full: 'ఢిల్లీ సరాయ్ రోహిల్లా–బాంద్రా టెర్మినస్ గరీబ్ రథ్ ఎక్స్‌ప్రెస్', fullRoute: 'ఢిల్లీ–బాంద్రా గరీబ్ రథ్: ఢిల్లీ సరాయ్ రోహిల్లా → బాంద్రా టెర్మినస్' },
    ML: { short: 'ഡൽഹി–ബാന്ദ്ര ഗരീബ് രഥ്', full: 'ഡൽഹി സരായ് രോഹില്ല–ബാന്ദ്ര ടെർമിനസ് ഗരീബ് രഥ് എക്സ്പ്രസ്', fullRoute: 'ഡൽഹി–ബാന്ദ്ര ഗരീബ് രഥ്: ഡൽഹി സരായ് രോഹില്ല → ബാന്ദ്ര ടെർമിനസ്' }
  },
  '12259': {
    EN: { short: 'Sealdah Duronto', full: 'Sealdah–Bikaner AC Duronto Express', fullRoute: 'Sealdah Duronto: Sealdah → New Delhi' },
    HI: { short: 'सियालदह दुरंतो', full: 'सियालदह-बीकानेर एसी दुरंतो एक्सप्रेस', fullRoute: 'सियालदह दुरंतो: सियालदह → नई दिल्ली' },
    TA: { short: 'சீல்டா துரந்தோ', full: 'சீல்டா–பிகானேர் ஏசி துரந்தோ எக்ஸ்பிரஸ்', fullRoute: 'சீல்டா துரந்தோ: சீல்டா → புது தில்லி' },
    TE: { short: 'సీల్దా దురంతో', full: 'సీల్దా–బికనీర్ ఎసి దురంతో ఎక్స్‌ప్రెస్', fullRoute: 'సీల్దా దురంతో: సీల్దా → న్యూఢిల్లీ' },
    ML: { short: 'സീൽദ ദുരന്തോ', full: 'സീൽദ–ബിക്കാനീർ എസി ദുരന്തോ എക്സ്പ്രസ്', fullRoute: 'സീൽദ ദുരന്തോ: സീൽദ → ന്യൂഡൽഹി' }
  },
  '20607': {
    EN: { short: 'Chennai–Mysuru Vande Bharat', full: 'MGR Chennai Central–Mysuru Vande Bharat Express', fullRoute: 'Chennai–Mysuru Vande Bharat: Chennai Central → Mysuru' },
    HI: { short: 'चेन्नई-मैसूरु वंदे भारत', full: 'एमजीआर चेन्नई सेंट्रल-मैसूरु वंदे भारत एक्सप्रेस', fullRoute: 'चेन्नई-मैसूरु वंदे भारत: चेन्नई सेंट्रल → मैसूरु' },
    TA: { short: 'சென்னை–மைசூரு வந்தே பாரத்', full: 'எம்.ஜி.ஆர் சென்னை சென்ட்ரல்–மைசூரு வந்தே பாரத் எக்ஸ்பிரஸ்', fullRoute: 'சென்னை–மைசூரு வந்தே பாரத்: சென்னை சென்ட்ரல் → மைசூரு' },
    TE: { short: 'చెన్నై–మైసూరు వందే భారత్', full: 'ఎం.జి.ఆర్ చెన్నై సెంట్రల్–మైసూరు వందే భారత్ ఎక్స్‌ప్రెస్', fullRoute: 'చెన్నై–మైసూరు వందే భారత్: చెన్నై సెంట్రల్ → మైసూరు' },
    ML: { short: 'ചെന്നൈ–മൈസൂരു വന്ദേ ഭാരത്', full: 'എം.ജി.ആർ ചെന്നൈ സെൻട്രൽ–മൈസൂരു വന്ദേ ഭാരത് എക്സ്പ്രസ്', fullRoute: 'ചെന്നൈ–മൈസൂരു വന്ദേ ഭാരത്: ചെന്നൈ സെൻട്രൽ → മൈസൂരു' }
  },
  '12019': {
    EN: { short: 'Howrah–Ranchi Shatabdi', full: 'Howrah–Ranchi Shatabdi Express', fullRoute: 'Howrah–Ranchi Shatabdi: Howrah → Ranchi' },
    HI: { short: 'हावड़ा-रांची शताब्दी', full: 'हावड़ा-रांची शताब्दी एक्सप्रेस', fullRoute: 'हावड़ा-रांची शताब्दी: हावड़ा → रांची' },
    TA: { short: 'ஹவுரா–ராஞ்சி சதாப்தி', full: 'ஹவுரா–ராஞ்சி சதாப்தி எக்ஸ்பிரஸ்', fullRoute: 'ஹவுரா–ராஞ்சி சதாப்தி: ஹவுரா → ராஞ்சி' },
    TE: { short: 'హౌరా–రాంచీ శతాబ్ది', full: 'హౌరా–రాంచీ శతాబ్ది ఎక్స్‌ప్రెస్', fullRoute: 'హౌరా–రాంచీ శతాబ్ది: హౌరా → రాంచీ' },
    ML: { short: 'ഹൗറ–റാഞ്ചി ശതാബ്ദി', full: 'ഹൗറ–റാഞ്ചി ശതാബ്ദി എക്സ്പ്രസ്', fullRoute: 'ഹൗറ–റാഞ്ചി ശതാബ്ദി: ഹൗറ → റാഞ്ചി' }
  },
  '12245': {
    EN: { short: 'Howrah–Yesvantpur Duronto', full: 'Howrah–Yesvantpur AC Duronto Express', fullRoute: 'Howrah–Yesvantpur Duronto: Howrah → Yesvantpur' },
    HI: { short: 'हावड़ा-यशवंतपुर दुरंतो', full: 'हावड़ा-यशवंतपुर एसी दुरंतो एक्सप्रेस', fullRoute: 'हावड़ा-यशवंतपुर दुरंतो: हावड़ा → यशवंतपुर' },
    TA: { short: 'ஹவுரா–யஷ்வந்த்பூர் துரந்தோ', full: 'ஹவுரா–யஷ்வந்த்பூர் ஏசி துரந்தோ எக்ஸ்பிரஸ்', fullRoute: 'ஹவுரா–யஷ்வந்த்பூர் துரந்தோ: ஹவுரா → யஷ்வந்த்பூர்' },
    TE: { short: 'హౌరా–యశ్వంతపూర్ దురంతో', full: 'హౌరా–యశ్వంతపూర్ ఎసి దురంతో ఎక్స్‌ప్రెస్', fullRoute: 'హౌరా–యశ్వంతపూర్ దురంతో: హౌరా → యశ్వంతపూర్' },
    ML: { short: 'ഹൗറ–യശ്വന്ത്പൂർ ദുരന്തോ', full: 'ഹൗറ–യശ്വന്ത്പൂർ എസി ദുരന്തോ എക്സ്പ്രസ്', fullRoute: 'ഹൗറ–യശ്വന്ത്പൂർ ദുരന്തോ: ഹൗറ → യശ്വന്ത്പൂർ' }
  },
  '12393': {
    EN: { short: 'Sampoorna Kranti Exp', full: 'Sampoorna Kranti Superfast Express', fullRoute: 'Sampoorna Kranti: Rajendra Nagar → New Delhi' },
    HI: { short: 'सम्पूर्ण क्रांति एक्सप्रेस', full: 'सम्पूर्ण क्रांति सुपरफास्ट एक्सप्रेस', fullRoute: 'सम्पूर्ण क्रांति एक्सप्रेस: राजेंद्र नगर → नई दिल्ली' },
    TA: { short: 'சம்பூர்ண கிராந்தி எக்ஸ்பிரஸ்', full: 'சம்பூர்ண கிராந்தி சூப்பர்பாஸ்ட் எக்ஸ்பிரஸ்', fullRoute: 'சம்பூர்ண கிராந்தி எக்ஸ்பிரஸ்: ராஜேந்திர நகர் → புது தில்லி' },
    TE: { short: 'సంపూర్ణ క్రాంతి ఎక్స్‌ప్రెస్', full: 'సంపూర్ణ క్రాంతి సూపర్ ఫాస్ట్ ఎక్స్‌ప్రెస్', fullRoute: 'సంపూర్ణ క్రాంతి ఎక్స్‌ప్రెస్: రాజేంద్ర నగర్ → న్యూఢిల్లీ' },
    ML: { short: 'സമ്പൂർണ്ണ ക്രാന്തി എക്സ്പ്രസ്', full: 'സമ്പൂർണ്ണ ക്രാന്തി സൂപ്പർഫാസ്റ്റ് എക്സ്പ്രസ്', fullRoute: 'സമ്പൂർണ്ണ ക്രാന്തി എക്സ്പ്രസ്: രാജേന്ദ്ര നഗർ → ന്യൂഡൽഹി' }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tStation: (name: string) => string;
  tTrainName: (nameOrNo: string, explicitTrainNo?: string, omitNumber?: boolean) => string;
  tTrainFullRoute: (trainNoOrName: string) => string;
  tSectionName: (sectionName: string) => string;
  tSubtext: (subtext: string) => string;
  tStatusLabel: (statusLabel: string) => string;
  tDynamic: (text: string) => string;
  tAlertTitle: (alert: any) => string;
  tAlertIssue: (alert: any) => string;
  tPassengerReport: (alertOrReport: any) => string;
  tTimeAgo: (val?: string | number) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  setLanguage: () => {},
  t: (key) => key,
  tStation: (name) => name,
  tTrainName: (nameOrNo) => nameOrNo,
  tTrainFullRoute: (nameOrNo) => nameOrNo,
  tSectionName: (name) => name,
  tSubtext: (text) => text,
  tStatusLabel: (status) => status,
  tDynamic: (text) => text,
  tAlertTitle: (alert) => (typeof alert === 'string' ? alert : alert?.title || ''),
  tAlertIssue: (alert) => (typeof alert === 'string' ? alert : alert?.issue || ''),
  tPassengerReport: (rep) => (typeof rep === 'string' ? rep : rep?.passenger_report || ''),
  tTimeAgo: (val) => String(val || ''),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('trainly_lang');
    return (saved && ['EN', 'HI', 'TA', 'TE', 'ML'].includes(saved)) ? (saved as Language) : 'EN';
  });

  useEffect(() => {
    localStorage.setItem('trainly_lang', language);
  }, [language]);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN'][key] || key;
  };

  const tStation = (name: string): string => {
    if (!name) return '';
    let clean = name.trim();
    let extra = '';

    // Strip and preserve attached timestamps ONLY like " (15:40)" or " (05:08)"
    const timeMatch = clean.match(/\s*(\(\d{1,2}:\d{2}(?:\s*[ap]m)?\))$/i);
    if (timeMatch) {
      extra = ' ' + timeMatch[1];
      clean = clean.replace(/\s*(\(\d{1,2}:\d{2}(?:\s*[ap]m)?\))$/i, '').trim();
    }

    // 1. Direct match
    if (STATION_TRANSLATIONS[clean]?.[language]) {
      return STATION_TRANSLATIONS[clean][language] + extra;
    }

    // 2. Case-insensitive exact match
    const lowerClean = clean.toLowerCase();
    for (const [k, v] of Object.entries(STATION_TRANSLATIONS)) {
      if (k.toLowerCase() === lowerClean) {
        return v[language] + extra;
      }
    }

    // 3. Match with or without "Jn" or "Junction"
    const withJn = lowerClean.endsWith('jn') ? clean : `${clean} Jn`;
    const withoutJn = clean.replace(/\s*(?:jn|junction)$/i, '').trim();

    for (const [k, v] of Object.entries(STATION_TRANSLATIONS)) {
      const kLower = k.toLowerCase();
      if (
        kLower === withJn.toLowerCase() ||
        kLower === withoutJn.toLowerCase() ||
        kLower.replace(/\s*(?:jn|junction)$/i, '') === withoutJn.toLowerCase()
      ) {
        return v[language] + extra;
      }
    }

    return name;
  };

  const tTrainName = (nameOrNo: string, explicitTrainNo?: string, omitNumber: boolean = false): string => {
    if (!nameOrNo && !explicitTrainNo) return '';
    const raw = (nameOrNo || '').trim();

    // Detect 5-digit train number
    const matchNo = (explicitTrainNo || raw).match(/\b(\d{5})\b/);
    const trainNo = matchNo ? matchNo[1] : (explicitTrainNo || '');

    if (trainNo && TRAIN_NAME_TRANSLATIONS[trainNo]) {
      const trainEntry = TRAIN_NAME_TRANSLATIONS[trainNo][language] || TRAIN_NAME_TRANSLATIONS[trainNo]['EN'];
      const isFull = raw.toLowerCase().includes('express') || raw.toLowerCase().includes('tejas') || raw.toLowerCase().includes('rameswaram') || raw.toLowerCase().includes('grand');
      let translatedName = isFull ? trainEntry.full : trainEntry.short;

      if (omitNumber) {
        // Strip any train number if present in translatedName
        return translatedName.replace(/^\d+\s*/, '').trim();
      }

      // If raw contains route separator like '—' or '→' or ':' (e.g., '22490 Vande Bharat: Meerut → Varanasi')
      if (raw.includes('—') || raw.includes('->') || raw.includes('→') || raw.includes(':')) {
        const extra = raw.includes('(Arrived)') ? ` (${t('arrived')})` : '';
        return `${trainNo} ${trainEntry.fullRoute}${extra}`;
      }

      // If raw had the number in it or explicitTrainNo was supplied
      if (raw.includes(trainNo) || explicitTrainNo) {
        return `${trainNo} ${translatedName}`;
      }

      return translatedName;
    }

    return raw;
  };

  const tTrainFullRoute = (trainNoOrName: string): string => {
    if (!trainNoOrName) return '';
    const raw = trainNoOrName.trim();
    const matchNo = raw.match(/\b(\d{5})\b/);
    const trainNo = matchNo ? matchNo[1] : raw;

    if (trainNo && TRAIN_NAME_TRANSLATIONS[trainNo]) {
      const trainEntry = TRAIN_NAME_TRANSLATIONS[trainNo][language] || TRAIN_NAME_TRANSLATIONS[trainNo]['EN'];
      return trainEntry.fullRoute || trainEntry.full;
    }
    return raw;
  };

  const tSectionName = (sectionName: string): string => {
    if (!sectionName) return '';
    const parts = sectionName.split(/[–—-]/);
    if (parts.length === 2) {
      const stn1 = tStation(parts[0].trim());
      const stn2 = tStation(parts[1].trim());
      return `${stn1}–${stn2}`;
    }
    return tStation(sectionName);
  };

  const tStatusLabel = (statusLabel: string): string => {
    if (!statusLabel) return '';
    const raw = statusLabel.trim();
    if (raw.toLowerCase().includes('on time') || raw.toLowerCase().includes('on_time')) {
      return t('on_time');
    }
    if (raw.toLowerCase().includes('scheduled')) {
      return t('scheduled');
    }
    if (raw.toLowerCase().includes('arrived') || raw.toLowerCase().includes('completed')) {
      return t('arrived');
    }
    const minMatch = raw.match(/^\+(\d+)\s*(?:min|m)$/i);
    if (minMatch) {
      const mins = minMatch[1];
      if (language === 'HI') return `+${mins} मिनट`;
      if (language === 'TA') return `+${mins} நிமி`;
      if (language === 'TE') return `+${mins} నిమి`;
      if (language === 'ML') return `+${mins} മിനിറ്റ്`;
      return `+${mins} min`;
    }
    const hourMinMatch = raw.match(/^\+(\d+)h(?:\s*(\d+)m)?/i);
    if (hourMinMatch) {
      const h = hourMinMatch[1];
      const m = hourMinMatch[2];
      if (m) {
        if (language === 'HI') return `+${h}घं ${m}मि`;
        if (language === 'TA') return `+${h}மணி ${m}நிமி`;
        if (language === 'TE') return `+${h}గం ${m}నిమి`;
        if (language === 'ML') return `+${h}മ ${m}മി`;
        return `+${h}h ${m}m`;
      } else {
        if (language === 'HI') return `+${h} घंटा`;
        if (language === 'TA') return `+${h} மணிநேரம்`;
        if (language === 'TE') return `+${h} గంటలు`;
        if (language === 'ML') return `+${h} മണിക്കൂർ`;
        return `+${h}h`;
      }
    }
    return tDynamic(raw);
  };

  const tSubtext = (subtext: string): string => {
    if (!subtext) return '';
    const clean = subtext.trim();

    // 1. "Currently between {A} and {B} [extra]"
    const betweenMatch = clean.match(/^Currently between (.+?) and (.+?)(?: (approaching.+|awaiting.+))?$/i);
    if (betweenMatch) {
      const stn1 = tStation(betweenMatch[1].trim());
      const stn2 = tStation(betweenMatch[2].trim());
      const extra = betweenMatch[3] ? ` (${tDynamic(betweenMatch[3].trim())})` : '';
      if (language === 'HI') return `वर्तमान में ${stn1} और ${stn2} के बीच${extra}`;
      if (language === 'TA') return `தற்போது ${stn1} மற்றும் ${stn2} இடையே${extra}`;
      if (language === 'TE') return `ప్రస్తుతం ${stn1} మరియు ${stn2} మధ్య${extra}`;
      if (language === 'ML') return `നിലവിൽ ${stn1}, ${stn2} എന്നിവയ്ക്കിടയിൽ${extra}`;
      return `Currently between ${stn1} and ${stn2}${extra}`;
    }

    // 2. "Currently near {A} [approaching/entering/awaiting {B}]"
    const nearMatch = clean.match(/^Currently near (.+?)(?: (approaching|entering|awaiting) (.+))?$/i);
    if (nearMatch) {
      const stn = tStation(nearMatch[1].trim());
      const verb = nearMatch[2]?.toLowerCase();
      const target = nearMatch[3] ? tStation(nearMatch[3].trim()) : '';
      if (verb === 'approaching') {
        if (language === 'HI') return `वर्तमान में ${stn} के पास, ${target} की ओर अग्रसर`;
        if (language === 'TA') return `தற்போது ${stn} அருகில், ${target} நோக்கிச் செல்கிறது`;
        if (language === 'TE') return `ప్రస్తుతం ${stn} సమీపంలో, ${target} వైపు వెళ్తోంది`;
        if (language === 'ML') return `നിലവിൽ ${stn} സമീപം, ${target} ലേക്ക് അടുക്കുന്നു`;
      } else if (verb === 'entering') {
        if (language === 'HI') return `वर्तमान में ${stn} के पास, ${target} में प्रवेश`;
        if (language === 'TA') return `தற்போது ${stn} அருகில், ${target} பிரிவுக்குள் நுழைகிறது`;
        if (language === 'TE') return `ప్రస్తుతం ${stn} సమీపంలో, ${target} లోకి ప్రవేశిస్తోంది`;
        if (language === 'ML') return `നിലവിൽ ${stn} സമീപം, ${target} ലേക്ക് പ്രവേശിക്കുന്നു`;
      } else if (verb === 'awaiting') {
        if (language === 'HI') return `वर्तमान में ${stn} के पास, लाइन क्लियरेंस की प्रतीक्षा में`;
        if (language === 'TA') return `தற்போது ${stn} அருகில், பாதை அனுமதிக்காக காத்திருக்கிறது`;
        if (language === 'TE') return `ప్రస్తుతం ${stn} సమీపంలో, క్లియరెన్స్ కోసం వేచి ఉంది`;
        if (language === 'ML') return `നിലവിൽ ${stn} സമീപം, ക്ലിയറൻസിനായി കാത്തിരിക്കുന്നു`;
      }
      if (language === 'HI') return `वर्तमान में ${stn} के पास`;
      if (language === 'TA') return `தற்போது ${stn} அருகில்`;
      if (language === 'TE') return `ప్రస్తుతం ${stn} సమీపంలో`;
      if (language === 'ML') return `നിലവിൽ ${stn} സമീപം`;
      return clean;
    }

    // 3. "Scheduled to depart from {A} at {time} IST"
    const schedMatch = clean.match(/^Scheduled to depart from (.+?) at (\d{1,2}:\d{2}) IST(?:\s*\((.+?)\))?/i);
    if (schedMatch) {
      const stn = tStation(schedMatch[1].trim());
      const time = schedMatch[2];
      if (language === 'HI') return `${stn} से ${time} बजे निर्धारित प्रस्थान`;
      if (language === 'TA') return `${stn} லிருந்து ${time} மணிக்கு புறப்பட திட்டமிடப்பட்டுள்ளது`;
      if (language === 'TE') return `${stn} నుండి ${time} గంటలకు బయలుదేరడానికి షెడ్యూల్ చేయబడింది`;
      if (language === 'ML') return `${stn} ൽ നിന്ന് ${time} ന് പുറപ്പെടാൻ നിശ്ചയിച്ചിരിക്കുന്നു`;
      return `Scheduled to depart from ${stn} at ${time} IST`;
    }

    // 4. "Arrived at {A} [at {time} IST] [(Journey Completed)]"
    const arrMatch = clean.match(/^Arrived at (.+?)(?: at (\d{1,2}:\d{2}) IST)?(?:\s*\((.+?)\))?$/i);
    if (arrMatch) {
      const stn = tStation(arrMatch[1].trim());
      const time = arrMatch[2] ? ` ${arrMatch[2]} बजे` : '';
      if (language === 'HI') return `${stn} पर आगमन${time} (${t('journey_completed')})`;
      if (language === 'TA') return `${stn} வந்து சேர்ந்தது (${t('journey_completed')})`;
      if (language === 'TE') return `${stn} చేరుకుంది (${t('journey_completed')})`;
      if (language === 'ML') return `${stn} എത്തിച്ചേർന്നു (${t('journey_completed')})`;
      return `Arrived at ${stn}${time} (Journey Completed)`;
    }

    return tDynamic(clean);
  };

  const tDynamic = (text: string): string => {
    if (!text) return '';
    // Direct match
    if (DYNAMIC_PHRASES[text]?.[language]) {
      return DYNAMIC_PHRASES[text][language];
    }
    // Partial matches
    for (const [enKey, transObj] of Object.entries(DYNAMIC_PHRASES)) {
      if (text.includes(enKey)) {
        return transObj[language];
      }
    }
    // Check if it's a station name
    if (STATION_TRANSLATIONS[text]?.[language]) {
      return STATION_TRANSLATIONS[text][language];
    }
    return text;
  };

  const tAlertTitle = (titleOrAlert: any): string => {
    if (!titleOrAlert) return '';
    let titleStr = '';
    let alertType = '';
    let delayVal = 0;
    let confPct = 0;

    if (typeof titleOrAlert === 'object') {
      titleStr = titleOrAlert.title || '';
      alertType = titleOrAlert.alert_type || '';
      delayVal = titleOrAlert.delay_val || 0;
      confPct = titleOrAlert.confidence_pct || 0;
    } else {
      titleStr = String(titleOrAlert);
    }

    // 1. Severe Delay
    const severeMatch = titleStr.match(/Severe Delay\s*\(\+?(\d+)m\)/i);
    if (alertType === 'severe_delay' || severeMatch) {
      const mins = delayVal || (severeMatch ? parseInt(severeMatch[1], 10) : 0);
      const formattedDelay = tStatusLabel(`+${mins} min`).replace(/^विलंब:\s*/, '');
      return `${t('severe_delay')} (${formattedDelay})`;
    }

    // 2. Section Delay Hold
    const sectionMatch = titleStr.match(/Section Delay Hold\s*\(\+?(\d+)m\)/i);
    if (alertType === 'section_delay_hold' || sectionMatch) {
      const mins = delayVal || (sectionMatch ? parseInt(sectionMatch[1], 10) : 0);
      const formattedDelay = tStatusLabel(`+${mins} min`).replace(/^विलंब:\s*/, '');
      return `${t('section_delay_hold')} (${formattedDelay})`;
    }

    // 3. Low Prediction Confidence
    const confMatch = titleStr.match(/Low Prediction Confidence\s*\(\s*(\d+)%\s*\)/i);
    if (alertType === 'low_confidence' || confMatch) {
      const pct = confPct || (confMatch ? parseInt(confMatch[1], 10) : 0);
      return `${t('low_confidence')} (${pct}%)`;
    }

    return titleStr;
  };

  const tAlertIssue = (alert: any): string => {
    if (!alert) return '';
    const whyRaw = alert.why_this_eta || (alert.issue ? alert.issue.split(/\s*Near\s+/i)[0] : '');
    const translatedWhy = tDynamic(whyRaw.trim());

    const nearStn = tStation(alert.near_station || '');
    const nextStn = tStation(alert.next_station || '');
    const eta = alert.next_eta ? ` (${alert.next_eta})` : '';
    const speed = alert.speed_kmh;

    // Pattern 1: Severe Delay / Approach next stop
    if (alert.alert_type === 'severe_delay' || /next stop/i.test(alert.issue || '')) {
      if (nearStn && nextStn) {
        if (language === 'HI') return `${translatedWhy} ${nearStn} के पास, अगला स्टॉप ${nextStn}${eta}।`;
        if (language === 'TA') return `${translatedWhy} ${nearStn} அருகில், அடுத்த நிறுத்தம் ${nextStn}${eta}.`;
        if (language === 'TE') return `${translatedWhy} ${nearStn} సమీపంలో, తదుపరి స్టాప్ ${nextStn}${eta}.`;
        if (language === 'ML') return `${translatedWhy} ${nearStn} സമീപം, അടുത്ത സ്റ്റോപ്പ് ${nextStn}${eta}.`;
        return `${translatedWhy} Near ${nearStn}, next stop ${nextStn}${eta}.`;
      }
    }

    // Pattern 2: Section Delay Hold / approaching at speed
    if (alert.alert_type === 'section_delay_hold' || /approaching/i.test(alert.issue || '')) {
      if (nearStn && nextStn) {
        if (language === 'HI') return `${translatedWhy} ${nearStn} के पास, ${speed || ''} किमी/घंटा की गति से ${nextStn} की ओर अग्रसर।`;
        if (language === 'TA') return `${translatedWhy} ${nearStn} அருகில், ${speed || ''} கிமீ/மணி வேகத்தில் ${nextStn} நோக்கிச் செல்கிறது.`;
        if (language === 'TE') return `${translatedWhy} ${nearStn} సమీపంలో, ${speed || ''} కిమీ/గం వేగంతో ${nextStn} వైపు వెళ్తోంది.`;
        if (language === 'ML') return `${translatedWhy} ${nearStn} സമീപം, ${speed || ''} കി.മീ/മണിക്കൂർ വേഗതയിൽ ${nextStn} ലേക്ക് അടുക്കുന്നു.`;
        return `${translatedWhy} Near ${nearStn}, approaching ${nextStn} at ${speed || ''} km/h.`;
      }
    }

    // Pattern 3: Low prediction confidence
    if (alert.alert_type === 'low_confidence' || /Telemetry variance/i.test(alert.issue || '')) {
      if (nearStn && nextStn) {
        if (language === 'HI') return `${translatedWhy} ${nearStn} के पास। ${nextStn} की ओर टेलीमेट्री विचलन का पता चला।`;
        if (language === 'TA') return `${translatedWhy} ${nearStn} அருகில். ${nextStn} அணுகுமுறையில் டெலிமெட்ரி மாறுபாடு கண்டறியப்பட்டது.`;
        if (language === 'TE') return `${translatedWhy} ${nearStn} సమీపంలో. ${nextStn} వద్ద టెలిమెట్రీ వ్యత్యాసం గుర్తించబడింది.`;
        if (language === 'ML') return `${translatedWhy} ${nearStn} സമീപം. ${nextStn} ലേക്ക് ടെലിമെട്രി വ്യതിയാനം കണ്ടെത്തി.`;
        return `${translatedWhy} Near ${nearStn}. Telemetry variance detected on approach to ${nextStn}.`;
      }
    }

    return tDynamic(alert.issue || alert.message || '');
  };

  const tPassengerReport = (repOrAlert: any): string => {
    if (!repOrAlert) return t('no_passenger_reports');
    let rawStr = '';
    let note = '';
    let confs = 0;

    if (typeof repOrAlert === 'object') {
      rawStr = repOrAlert.passenger_report || '';
      note = repOrAlert.passenger_note || '';
      confs = repOrAlert.passenger_confirmations || 0;
    } else {
      rawStr = String(repOrAlert);
    }

    if (!rawStr || rawStr === 'No passenger reports yet' || rawStr === "'' (1 confirmed)") {
      return t('no_passenger_reports');
    }

    if (note && confs > 0) {
      return `"${tDynamic(note)}" (${confs} ${t('confirmed')})`;
    }

    // Parse string pattern: "Note text" (N confirmed)
    const match = rawStr.match(/^"?(.*?)"?\s*\(\s*(\d+)\s+confirmed\s*\)$/i);
    if (match) {
      const extractedNote = match[1].trim();
      const count = match[2];
      return `"${tDynamic(extractedNote)}" (${count} ${t('confirmed')})`;
    }

    return tDynamic(rawStr);
  };

  const tTimeAgo = (val?: string | number): string => {
    if (val === undefined || val === null) return '';
    if (typeof val === 'number') {
      if (val < 1) return t('just_now');
      if (val < 60) {
        if (language === 'HI') return `${val} सेकंड पहले`;
        if (language === 'TA') return `${val} விநாடிகளுக்கு முன்`;
        if (language === 'TE') return `${val} సెకన్ల క్రితం`;
        if (language === 'ML') return `${val} സെക്കൻഡ് മുമ്പ്`;
        return `${val}s ago`;
      }
      const mins = Math.floor(val / 60);
      if (mins < 60) {
        if (language === 'HI') return `${mins} मिनट पहले`;
        if (language === 'TA') return `${mins} நிமிடம் முன்`;
        if (language === 'TE') return `${mins} నిమిషాల క్రితం`;
        if (language === 'ML') return `${mins} മിനിറ്റ് മുമ്പ്`;
        return `${mins}m ago`;
      }
      const hrs = Math.floor(mins / 60);
      if (language === 'HI') return `${hrs} घंटे पहले`;
      if (language === 'TA') return `${hrs} மணிநேரம் முன்`;
      if (language === 'TE') return `${hrs} గంటల క్రితం`;
      if (language === 'ML') return `${hrs} മണിക്കൂർ മുമ്പ്`;
      return `${hrs}h ago`;
    }

    const str = String(val).trim();
    if (!str) return '';
    if (str.toLowerCase() === 'just now') return t('just_now');

    const match = str.match(/^(\d+)\s*([smh])\s*ago$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      if (unit === 's') {
        if (language === 'HI') return `${num} सेकंड पहले`;
        if (language === 'TA') return `${num} விநாடிகளுக்கு முன்`;
        if (language === 'TE') return `${num} సెకన్ల క్రితం`;
        if (language === 'ML') return `${num} സെക്കൻഡ് മുമ്പ്`;
        return `${num}s ago`;
      }
      if (unit === 'm') {
        if (language === 'HI') return `${num} मिनट पहले`;
        if (language === 'TA') return `${num} நிமிடம் முன்`;
        if (language === 'TE') return `${num} నిమిషాల క్రితం`;
        if (language === 'ML') return `${num} മിനിറ്റ് മുമ്പ്`;
        return `${num}m ago`;
      }
      if (unit === 'h') {
        if (language === 'HI') return `${num} घंटे पहले`;
        if (language === 'TA') return `${num} மணிநேரம் முன்`;
        if (language === 'TE') return `${num} గంటల క్రితం`;
        if (language === 'ML') return `${num} മണിക്കൂർ മുമ്പ്`;
        return `${num}h ago`;
      }
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tStation, tTrainName, tTrainFullRoute, tSectionName, tSubtext, tStatusLabel, tDynamic, tAlertTitle, tAlertIssue, tPassengerReport, tTimeAgo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
