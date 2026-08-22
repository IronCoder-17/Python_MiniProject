"""
Generates database/seed.sql with realistic demo data for Iconic Estates India.

Image strategy: uses https://placehold.co (a reliable, license-free placeholder
image generator) tinted to the site's ink/gold palette, with descriptive text
baked into the URL. This avoids hot-linking real photographers' work or real
people's photos in seed/demo data. Swap these for licensed property
photography and real team headshots before going to production — see README.

Run: python3 gen_seed.py  (writes seed.sql in the same folder)
"""

INK = "0F1B2D"
GOLD = "C9A24B"
IVORY = "F7F3EA"

def placeholder(text, w=900, h=650, bg=INK, fg=GOLD):
    safe = text.replace(" ", "+")
    return f"https://placehold.co/{w}x{h}/{bg}/{fg}?text={safe}&font=playfair-display"

def avatar(seed):
    # Illustrated (non-photographic) avatar -- never depicts a real person.
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed.replace(' ', '')}"

def logo(text):
    return placeholder(text, 400, 200, bg=IVORY, fg=INK)

sql = []
sql.append("USE iconic_estates_india;\n")
sql.append("SET FOREIGN_KEY_CHECKS = 0;\n")
sql.append("TRUNCATE TABLE property_images;")
sql.append("TRUNCATE TABLE floor_plans;")
sql.append("TRUNCATE TABLE properties;")
sql.append("TRUNCATE TABLE builders;")
sql.append("TRUNCATE TABLE civil_engineers;")
sql.append("TRUNCATE TABLE interior_designers;")
sql.append("TRUNCATE TABLE exterior_designers;")
sql.append("TRUNCATE TABLE leads;")
sql.append("TRUNCATE TABLE inquiries;")
sql.append("TRUNCATE TABLE market_reports;")
sql.append("TRUNCATE TABLE testimonials;")
sql.append("TRUNCATE TABLE ownership_journey;")
sql.append("TRUNCATE TABLE iconic_addresses;")
sql.append("TRUNCATE TABLE platform_stats;")
sql.append("SET FOREIGN_KEY_CHECKS = 1;\n")

def esc(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("\\", "\\\\").replace("'", "\\'") + "'"

# ---------------- BUILDERS ----------------
builders = [
    ("Shivalik Group", 28, 65, "Ahmedabad,Gandhinagar", "Gujarat-rooted developer known for premium residential townships and retail destinations.", "GJ/RERA/SHIV/001"),
    ("Adani Realty", 20, 40, "Ahmedabad,Mumbai,Gurugram", "Real estate arm of the Adani Group, delivering large-format mixed-use developments.", "GJ/RERA/ADNI/002"),
    ("Godrej Properties", 27, 200, "Mumbai,Pune,Bangalore,Gurugram", "One of India's most trusted listed developers across residential and commercial assets.", "MH/RERA/GODR/003"),
    ("Sobha Limited", 30, 150, "Bangalore,Gurugram,Pune", "Engineering-led luxury developer with in-house backward integration.", "KA/RERA/SOBH/004"),
    ("Prestige Group", 38, 290, "Bangalore,Hyderabad,Chennai,Mumbai", "South India's leading diversified developer across residential, retail and hospitality.", "KA/RERA/PRES/005"),
    ("Lodha Group", 45, 175, "Mumbai,Pune,Hyderabad", "Mumbai-headquartered developer behind some of India's tallest luxury residences.", "MH/RERA/LODH/006"),
]
sql.append("INSERT INTO builders (name, logo_url, years_experience, total_projects, cities_served, description, rera_registration) VALUES")
rows = []
for name, yrs, proj, cities, desc, rera in builders:
    rows.append(f"({esc(name)}, {esc(logo(name))}, {yrs}, {proj}, {esc(cities)}, {esc(desc)}, {esc(rera)})")
sql.append(",\n".join(rows) + ";\n")

builder_id_map = {name: i + 1 for i, (name, *_rest) in enumerate(builders)}

# ---------------- PROPERTIES ----------------
properties = [
    # title, category, type, price(INR), location_area, city, state, sqft, bed, bath, park, status, rera, builder, luxury, featured
    ("Shivalik Sereno Villa", "Residential", "Villa", 24500000, "Bopal", "Ahmedabad", "Gujarat", 3250, 4, 4, 2, "Ready To Move", "GJ/RERA/P/001", "Shivalik Group", 4, 1),
    ("Adani Shantigram Bungalow", "Residential", "Bungalow", 38500000, "Shantigram", "Ahmedabad", "Gujarat", 4100, 5, 5, 3, "Ready To Move", "GJ/RERA/P/002", "Adani Realty", 4, 1),
    ("Sindhu Heritage Tenament", "Residential", "Tenament", 9800000, "Sindhu Bhavan Road", "Ahmedabad", "Gujarat", 1850, 3, 2, 1, "Under Construction", "GJ/RERA/P/003", "Shivalik Group", 3, 0),
    ("Godrej Emerald Flat", "Residential", "Flat", 6200000, "Wakad", "Pune", "Maharashtra", 1150, 2, 2, 1, "Ready To Move", "MH/RERA/P/004", "Godrej Properties", 3, 0),
    ("Lodha Park Apartment", "Residential", "Apartment", 18500000, "Lower Parel", "Mumbai", "Maharashtra", 1450, 3, 3, 1, "New Launch", "MH/RERA/P/005", "Lodha Group", 4, 1),
    ("Sobha Crystal Penthouse", "Residential", "Penthouse", 65000000, "Whitefield", "Bangalore", "Karnataka", 5200, 4, 5, 3, "Ready To Move", "KA/RERA/P/006", "Sobha Limited", 5, 1),
    ("Prestige Skyline Duplex", "Residential", "Duplex", 29500000, "Sarjapur Road", "Bangalore", "Karnataka", 2900, 4, 4, 2, "Under Construction", "KA/RERA/P/007", "Prestige Group", 4, 0),
    ("Adani Compact Studio", "Residential", "Studio Apartment", 3200000, "Gota", "Ahmedabad", "Gujarat", 480, 1, 1, 1, "Ready To Move", "GJ/RERA/P/008", "Adani Realty", 2, 0),
    ("Godrej Business Office", "Commercial", "Office", 14500000, "Hinjewadi", "Pune", "Maharashtra", 2200, 0, 2, 4, "Ready To Move", "MH/RERA/P/009", "Godrej Properties", 3, 0),
    ("Prestige High Street Retail", "Commercial", "Retail Shop", 21000000, "Indiranagar", "Bangalore", "Karnataka", 1600, 0, 1, 0, "Ready To Move", "KA/RERA/P/010", "Prestige Group", 3, 0),
    ("Lodha Auto Showroom", "Commercial", "Showroom", 48000000, "Andheri East", "Mumbai", "Maharashtra", 5400, 0, 2, 6, "Ready To Move", "MH/RERA/P/011", "Lodha Group", 3, 0),
    ("Adani Logistics Warehouse", "Commercial", "Warehouse", 32000000, "Sanand", "Ahmedabad", "Gujarat", 18000, 0, 1, 10, "Ready To Move", "GJ/RERA/P/012", "Adani Realty", 2, 0),
    ("Sobha Co-working Hub", "Commercial", "Co-working Space", 9500000, "Sarjapur Road", "Bangalore", "Karnataka", 3100, 0, 4, 8, "New Launch", "KA/RERA/P/013", "Sobha Limited", 3, 0),
    ("Shivalik Riverside Farmhouse", "Agricultural", "Farmhouse", 18900000, "Sanand Outskirts", "Ahmedabad", "Gujarat", 9000, 3, 2, 4, "Ready To Move", "GJ/RERA/P/014", "Shivalik Group", 3, 0),
    ("Lonavala Agricultural Plot", "Agricultural", "Agricultural Land", 4800000, "Lonavala", "Pune", "Maharashtra", 21780, 0, 0, 0, "Ready To Move", "MH/RERA/P/015", "Godrej Properties", 2, 0),
    ("Coorg Weekend Home", "Agricultural", "Weekend Home", 16500000, "Coorg Hills", "Bangalore", "Karnataka", 4200, 3, 3, 2, "Ready To Move", "KA/RERA/P/016", "Prestige Group", 3, 0),
    ("Ambli Ultra Luxury Villa", "Luxury", "Ultra Luxury Villa", 95000000, "Ambli", "Ahmedabad", "Gujarat", 7800, 5, 6, 4, "Ready To Move", "GJ/RERA/P/017", "Shivalik Group", 5, 1),
    ("Worli Sky Penthouse", "Luxury", "Luxury Penthouse", 185000000, "Worli", "Mumbai", "Maharashtra", 6800, 4, 5, 4, "Ready To Move", "MH/RERA/P/018", "Lodha Group", 5, 1),
    ("Whitefield Golf Villa", "Luxury", "Golf Villa", 72000000, "Whitefield", "Bangalore", "Karnataka", 5600, 4, 5, 3, "Under Construction", "KA/RERA/P/019", "Sobha Limited", 5, 1),
    ("Goa Beach Villa Retreat", "Luxury", "Beach Villa", 110000000, "Candolim", "Mumbai", "Maharashtra", 6200, 5, 6, 4, "Ready To Move", "MH/RERA/P/020", "Lodha Group", 5, 1),
    ("DLF Golf Course Residence", "Luxury", "Ultra Luxury Villa", 145000000, "Golf Course Road", "Delhi NCR", "Haryana", 8200, 5, 6, 4, "Ready To Move", "HR/RERA/P/021", "Godrej Properties", 5, 1),
    ("Jubilee Hills Smart Villa", "Residential", "Villa", 42500000, "Jubilee Hills", "Hyderabad", "Telangana", 4400, 4, 4, 3, "Ready To Move", "TS/RERA/P/022", "Prestige Group", 4, 0),
    ("Vadodara Riverside Flat", "Residential", "Flat", 5400000, "Alkapuri", "Vadodara", "Gujarat", 1280, 2, 2, 1, "Ready To Move", "GJ/RERA/P/023", "Shivalik Group", 3, 0),
    ("Rajkot Garden Bungalow", "Residential", "Bungalow", 11500000, "Kalawad Road", "Rajkot", "Gujarat", 2600, 3, 3, 2, "Ready To Move", "GJ/RERA/P/024", "Adani Realty", 3, 0),
]

def price_label(rupees):
    crore = 10000000
    lakh = 100000
    if rupees >= crore:
        v = rupees / crore
        return f"₹ {v:.2f} Crore".replace(".00", "")
    else:
        v = rupees / lakh
        return f"₹ {v:.2f} Lakh".replace(".00", "")

gallery_tags = ["Hero", "Living Room", "Kitchen", "Bedroom", "Bathroom", "Exterior", "Amenities"]

prop_inserts = []
image_inserts = []
for idx, p in enumerate(properties, start=1):
    title, cat, ptype, price, area, city, state, sqft, bed, bath, park, status, rera, builder, luxury, featured = p
    label = price_label(price)
    hero = placeholder(f"{ptype} {city}")
    builder_id = builder_id_map[builder]
    amenities = "Clubhouse,Swimming Pool,Gymnasium,24x7 Security,Power Backup,Landscaped Garden"
    desc = f"{title} is a {ptype.lower()} in {area}, {city} offering {sqft} sq.ft. of thoughtfully designed living space, developed by {builder}."
    prop_inserts.append(
        f"({esc(title)}, {esc(cat)}, {esc(ptype)}, {price}, {esc(label)}, {esc(area)}, {esc(city)}, {esc(state)}, "
        f"{sqft}, {bed}, {bath}, {park}, {esc(status)}, {esc(rera)}, {builder_id}, {luxury}, {esc(desc)}, "
        f"{esc(amenities)}, {esc(hero)}, {featured})"
    )
    for tag in gallery_tags:
        img = placeholder(f"{tag} {ptype}")
        image_inserts.append(f"({idx}, {esc(img)}, {esc(tag)})")

sql.append(
    "INSERT INTO properties (title, category, property_type, price, price_label, location_area, city, state, "
    "area_sqft, bedrooms, bathrooms, parking, possession_status, rera_number, builder_id, luxury_rating, "
    "description, amenities, hero_image, is_featured) VALUES"
)
sql.append(",\n".join(prop_inserts) + ";\n")

sql.append("INSERT INTO property_images (property_id, image_url, tag) VALUES")
sql.append(",\n".join(image_inserts) + ";\n")

# ---------------- EXPERTS ----------------
civil_engineers = [
    ("Rakesh Patel", 18, 64, "Structural Engineering, High-Rise Foundations", "Ahmedabad"),
    ("Sunita Rao", 14, 48, "Seismic Design, RCC Structures", "Mumbai"),
    ("Vikram Shah", 22, 80, "Soil Mechanics, Site Grading", "Bangalore"),
    ("Anita Desai", 11, 35, "MEP Coordination, Green Buildings", "Pune"),
]
sql.append("INSERT INTO civil_engineers (name, photo_url, experience_years, projects_completed, specialization, city) VALUES")
rows = [f"({esc(n)}, {esc(avatar(n))}, {y}, {p}, {esc(s)}, {esc(c)})" for n, y, p, s, c in civil_engineers]
sql.append(",\n".join(rows) + ";\n")

interior_designers = [
    ("Meera Kapoor", 16, "Contemporary Luxury", "Mumbai"),
    ("Arjun Nair", 10, "Indo-Scandinavian", "Bangalore"),
    ("Priya Mehta", 13, "Art Deco Revival", "Ahmedabad"),
    ("Kabir Malhotra", 9, "Minimalist Zen", "Delhi NCR"),
]
sql.append("INSERT INTO interior_designers (name, photo_url, experience_years, design_style, city) VALUES")
rows = [f"({esc(n)}, {esc(avatar(n))}, {y}, {esc(s)}, {esc(c)})" for n, y, s, c in interior_designers]
sql.append(",\n".join(rows) + ";\n")

exterior_designers = [
    ("Rohan Joshi", 15, "Façade Lighting & Landscape", "Pune"),
    ("Divya Iyer", 12, "Sustainable Landscaping", "Bangalore"),
    ("Farhan Sheikh", 19, "Stone & Glass Facades", "Ahmedabad"),
]
sql.append("INSERT INTO exterior_designers (name, photo_url, experience_years, specialty, city) VALUES")
rows = [f"({esc(n)}, {esc(avatar(n))}, {y}, {esc(s)}, {esc(c)})" for n, y, s, c in exterior_designers]
sql.append(",\n".join(rows) + ";\n")

# ---------------- MARKET REPORTS ----------------
market_reports = [
    ("Ahmedabad", "Ahmedabad Growth Index", 9.2, 28.5, 52.0, 145.0, 3.8, "2026-04-01"),
    ("Mumbai", "Mumbai Luxury Index", 7.5, 24.0, 46.5, 128.0, 2.9, "2026-04-01"),
    ("Bangalore", "Bangalore Rental Yield", 8.8, 27.2, 49.0, 132.0, 4.4, "2026-04-01"),
    ("Pune", "Pune Appreciation Rate", 8.1, 25.8, 47.5, 121.0, 3.6, "2026-04-01"),
    ("Hyderabad", "Hyderabad Momentum Index", 9.6, 30.1, 55.0, 150.0, 4.1, "2026-04-01"),
    ("Delhi NCR", "Delhi NCR Prime Index", 7.0, 21.5, 41.0, 110.0, 2.6, "2026-04-01"),
]
sql.append("INSERT INTO market_reports (city, index_name, growth_1yr_pct, growth_3yr_pct, growth_5yr_pct, growth_10yr_pct, rental_yield_pct, report_date) VALUES")
rows = [f"({esc(c)}, {esc(n)}, {a}, {b}, {d}, {e}, {f}, {esc(g)})" for c, n, a, b, d, e, f, g in market_reports]
sql.append(",\n".join(rows) + ";\n")

# ---------------- TESTIMONIALS ----------------
testimonials = [
    ("Real estate cannot be lost or stolen. Purchased wisely, it remains the safest investment.", "Anonymous", "Property Investor", 1),
    ("Owning a home is a cornerstone of wealth and financial security.", "Anonymous", "Homeowner", 2),
    ("The best investment on Earth is Earth.", "Anonymous", "NRI Investor", 3),
]
sql.append("INSERT INTO testimonials (quote, author_name, author_title, sort_order) VALUES")
rows = [f"({esc(q)}, {esc(n)}, {esc(t)}, {o})" for q, n, t, o in testimonials]
sql.append(",\n".join(rows) + ";\n")

# ---------------- OWNERSHIP JOURNEY ----------------
journey = [
    (1, "Property Discovery", "Explore curated listings and shortlist homes matched to your goals.", "search"),
    (2, "Site Visit", "Walk the property and neighbourhood with a dedicated relationship manager.", "map-pin"),
    (3, "Documentation", "Title verification, RERA checks and agreement drafting handled end-to-end.", "file-text"),
    (4, "Loan Processing", "Bank tie-ups help structure financing and disbursement timelines.", "landmark"),
    (5, "Registration", "Stamp duty, registration and handover formalities completed with our team.", "stamp"),
    (6, "Possession", "Keys handed over along with a full snag-check and orientation walkthrough.", "key"),
    (7, "Wealth Creation", "Ongoing portfolio tracking as your asset appreciates over the years.", "trending-up"),
]
sql.append("INSERT INTO ownership_journey (step_number, title, description, icon) VALUES")
rows = [f"({n}, {esc(t)}, {esc(d)}, {esc(i)})" for n, t, d, i in journey]
sql.append(",\n".join(rows) + ";\n")

# ---------------- ICONIC ADDRESSES ----------------
addresses = [
    ("Ahmedabad", "Sindhu Bhavan Road", "Ahmedabad's premium boulevard of designer residences.", 9800),
    ("Ahmedabad", "Ambli", "Gated luxury villas minutes from the riverfront.", 8600),
    ("Ahmedabad", "Bopal", "Family-favoured suburb with strong rental demand.", 5200),
    ("Mumbai", "Bandra West", "Iconic sea-facing lanes blending heritage and glamour.", 62000),
    ("Mumbai", "Worli", "Skyline addresses with the city's tallest residences.", 58000),
    ("Mumbai", "Juhu", "Beachside prestige with old-money pedigree.", 54000),
    ("Bangalore", "Whitefield", "Tech-corridor micro-market with consistent appreciation.", 9200),
    ("Bangalore", "Sarjapur Road", "Emerging luxury cluster near major IT campuses.", 8400),
    ("Delhi NCR", "Golf Course Road", "Gurugram's flagship high-rise and villa address.", 16500),
    ("Delhi NCR", "DLF Phase 5", "Established premium enclave with mature infrastructure.", 15200),
]
sql.append("INSERT INTO iconic_addresses (city, locality, image_url, blurb, avg_price_per_sqft) VALUES")
rows = [f"({esc(c)}, {esc(l)}, {esc(placeholder(l))}, {esc(b)}, {pp})" for c, l, b, pp in addresses]
sql.append(",\n".join(rows) + ";\n")

# ---------------- PLATFORM STATS ----------------
stats = [
    ("properties_listed", "5000+", "Properties Listed", 1),
    ("happy_buyers", "2500+", "Happy Buyers", 2),
    ("builders", "150+", "Builders", 3),
    ("experts", "350+", "Experts", 4),
    ("transactions", "₹5000+ Cr", "Transactions Facilitated", 5),
    ("years_experience", "20+", "Years Industry Experience", 6),
]
sql.append("INSERT INTO platform_stats (stat_key, stat_value, stat_label, sort_order) VALUES")
rows = [f"({esc(k)}, {esc(v)}, {esc(l)}, {o})" for k, v, l, o in stats]
sql.append(",\n".join(rows) + ";\n")

with open("seed.sql", "w") as f:
    f.write("\n".join(sql))

print("seed.sql generated:", len(properties), "properties,", len(image_inserts), "images")
