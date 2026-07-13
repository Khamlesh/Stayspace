import mysql.connector
import json
import random
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CORE_EXE = ROOT_DIR / "stayspace_core.exe"

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Khamlesh@1234',
    'database': 'stayspace'
}

MAJOR_CITIES = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Bhopal', 'Patna', 'Visakhapatnam', 'Vijayawada',
    'Coimbatore', 'Kochi', 'Thiruvananthapuram', 'Mysuru', 'Chandigarh',
    'Ludhiana', 'Noida', 'Gurugram', 'Ghaziabad', 'Faridabad',
    'Varanasi', 'Prayagraj', 'Bhubaneswar', 'Raipur', 'Ranchi',
    'Guwahati', 'Jodhpur',
]

TOURIST_CITIES = [
    'Shimla', 'Manali', 'Dharamshala', 'Dalhousie', 'Leh', 'Srinagar',
    'Gulmarg', 'Pahalgam', 'Mussoorie', 'Nainital', 'Rishikesh', 'Auli',
    'Munnar', 'Ooty', 'Kodaikanal', 'Coorg', 'Darjeeling', 'Gangtok',
    'Mahabaleshwar', 'Mount Abu',
]

LOCALITIES = {
    'Mumbai': ['Bandra', 'Juhu', 'Andheri', 'Worli', 'Colaba', 'BKC', 'Powai', 'Lower Parel', 'Marine Drive', 'Dadar'],
    'Delhi': ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Hauz Khas', 'Pitampura', 'Mayur Vihar'],
    'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'MG Road', 'Electronic City', 'Hebbal', 'Marathahalli', 'Bannerghatta'],
    'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'HITEC City', 'Secunderabad', 'Madhapur', 'Kondapur', 'Begumpet', 'Ameerpet', 'LB Nagar'],
    'Chennai': ['T. Nagar', 'Adyar', 'Anna Nagar', 'Mylapore', 'Nungambakkam', 'Velachery', 'Chrompet', 'Porur', 'Thiruvanmiyur', 'Egmore'],
    'Kolkata': ['Park Street', 'Salt Lake', 'New Town', 'Ballygunge', 'Alipore', 'Gariahat', 'Bhowanipur', 'Dum Dum', 'Behala', 'Rajarhat'],
    'Pune': ['Koregaon Park', 'Kothrud', 'Baner', 'Aundh', 'Viman Nagar', 'Hinjewadi', 'Hadapsar', 'Kharadi', 'Wakad', 'Sinhagad Road'],
    'Ahmedabad': ['SG Highway', 'Satellite', 'Vastrapur', 'Navrangpura', 'CG Road', 'Bodakdev', 'Thaltej', 'Maninagar', 'Paldi', 'Ashram Road'],
    'Jaipur': ['Malviya Nagar', 'C-Scheme', 'Mansarovar', 'Vaishali Nagar', 'Jagatpura', 'Tonk Road', 'Ajmer Road', 'MI Road', 'Raja Park', 'Civil Lines'],
    'Surat': ['Athwa', 'Adajan', 'Vesu', 'Athwa Gate', 'Nanpura', 'Rander', 'Ring Road', 'Katargam', 'Bharuch', 'Dumas Road'],
    'Lucknow': ['Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar', 'Aminabad', 'Aashiana', 'Jankipuram', 'Vikas Nagar', 'Faizabad Road', 'IT City'],
    'Kanpur': ['Mall Road', 'Civil Lines', 'Swaroop Nagar', 'Kakadeo', 'Kidwai Nagar', 'Govind Nagar', 'Arya Nagar', 'Kalyanpur', 'Naubasta', 'Shyam Nagar'],
    'Nagpur': ['Dharampeth', 'Sadashiv Nagar', 'Sadar', 'Sitabuldi', 'Ajni', 'Manish Nagar', 'Wardhaman Nagar', 'Shankar Nagar', 'Laxmi Nagar', 'Trimurti Nagar'],
    'Indore': ['Vijay Nagar', 'Palasia', 'AB Road', 'Rajendra Nagar', 'Scheme 78', 'Bombay Hospital', 'Mangalia Road', 'Rajiv Gandhi Square', 'Bhawarkua', 'AB Bypass Road'],
    'Bhopal': ['MP Nagar', 'Arera Colony', 'Kolar Road', 'Hoshangabad Road', 'New Market', 'Shahpura', 'Bittan Market', 'Kasturba Nagar', 'Awadh Puri', 'Ayodhya Nagar'],
    'Patna': ['Boring Road', 'Fraser Road', 'Kankarbagh', 'Bailey Road', 'Rajendra Nagar', 'Patliputra Colony', 'Gandhi Maidan', 'Danapur', 'Saguna More', 'Phulwari Sharif'],
    'Visakhapatnam': ['RK Beach', 'MVP Colony', 'Dwaraka Nagar', 'RTC Complex', 'Gajuwaka', 'Madhurawada', 'Akkayyapalem', 'Murali Nagar', 'Lawsons Bay', 'Seethammadhara'],
    'Vijayawada': ['MG Road', 'Benz Circle', 'Gunadala', 'Mangalagiri', 'Poranki', 'Kanuru', 'Enikepadu', 'Ramavarapadu', 'Ajit Sagar Nagar', 'Governorpet'],
    'Coimbatore': ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Avinashi Road', 'Singular', 'Sai Baba Colony', 'Race Course', 'Tatabad', 'Podanur', 'Mettupalayam Road'],
    'Kochi': ['MG Road', 'Kakkanad', 'Edappally', 'Palarivattom', 'Vytilla', 'Fort Kochi', 'Mattancherry', 'Aluva', 'Panampilly Nagar', 'Elamakkara'],
    'Thiruvananthapuram': ['Kowdiar', 'Vellayambalam', 'Sasthamangalam', 'Kazhakootam', 'Technopark', 'Vattiyoorkavu', 'Neyyattinkara', 'Pattom', 'Ulloor', 'Parassala'],
    'Mysuru': ['Vani Vilas Mohalla', 'Saraswathipuram', 'Gokulam', 'Jayalakshmipuram', 'Hebbal', 'Kuvempunagar', 'Siddarthanagar', 'Nazarbad', 'Bannimantap', 'Lakshmipuram'],
    'Chandigarh': ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Sector 8', 'Manimajra', 'Sahibzada Ajit Singh Nagar', 'IT Park', 'Sector 26', 'Sector 9'],
    'Ludhiana': ['Model Town', 'Gill Road', 'Dugri', 'Sahibzada Ajit Singh Nagar', 'Pakhowal Road', 'Ferozepur Road', 'Civil Lines', 'Khanna', 'Jalandhar Road', 'GT Road'],
    'Noida': ['Sector 62', 'Sector 18', 'Sector 39', 'Sector 44', 'Sector 50', 'Sector 76', 'Greater Noida', 'Alpha', 'Beta', 'Gamma'],
    'Gurugram': ['DLF Phase 1', 'DLF Phase 4', 'Sohna Road', 'Golf Course Road', 'Sector 29', 'Sector 39', 'MG Road', 'Cyber Hub', 'Palam Vihar', 'Sushant Lok'],
    'Ghaziabad': ['Indirapuram', 'Kaushambi', 'Vasundhara', 'Raj Nagar', 'Crossings Republik', 'NH 24', 'Raj Nagar Extension', 'Ahinsa Khand', 'Shakti Khand', 'Vaishali'],
    'Faridabad': ['NIT', 'Sector 15', 'Sector 21', 'Sector 31', 'Sector 37', 'Palwal', 'Ballabgarh', 'Faridabad Sector 46', 'Sector 82', 'Greater Faridabad'],
    'Varanasi': ['Assi Ghat', 'Dashashwamedh Ghat', 'Lanka', 'Sigra', 'Bhelupur', 'Nadesar', 'Shivala', 'Orderly Bazaar', 'Chowk', 'Mahmoorganj'],
    'Prayagraj': ['Civil Lines', 'Katra', 'Leader Road', 'Mahatma Gandhi Road', 'Sadar', 'Naini', 'Chhota Chauraha', 'Baghara', 'Lucknow Road', 'Handia Road'],
    'Bhubaneswar': ['Saheed Nagar', 'Jayadev Vihar', 'Patia', 'Khandagiri', 'Rasulgarh', 'Chandrasekharpur', 'Jaydev Vihar', 'Infocity', 'Mancheswar', 'Kalarahanga'],
    'Raipur': ['Shankar Nagar', 'Civil Lines', 'Devendra Nagar', 'Telibandha', 'Aminpara', 'Govindpura', 'Raipur Railway Station', 'Mowa', 'Pachpedi Naka', 'Kotedhara'],
    'Ranchi': ['Kanke Road', 'Doranda', 'Upper Bazar', 'Main Road', 'Lalpur', 'Namkum', 'Morabadi', 'Hatia', 'Kadru', 'Ranchi Lake'],
    'Guwahati': ['Zoo Road', 'GS Road', 'Fancy Bazaar', 'Lachit Nagar', 'Panbazar', 'Silpukhuri', 'Christian Basti', 'Satgaon', 'Jalukbari', 'Beltola'],
    'Jodhpur': ['Sardar Market', 'Clock Tower', 'Pal Road', 'Paota', 'Ratanada', 'Shastri Nagar', 'Basni', 'Paota B Road', 'Sarang Ki Dhani', 'Bachhraj Colony'],
    'Shimla': ['Mall Road', 'The Ridge', 'Lakkar Bazaar', 'Chowk', 'Sanjauli', 'Kufri', 'Chhota Shimla', 'Boileauganj', 'Khara Pathar', 'Mashobra'],
    'Manali': ['Old Manali', 'Mall Road', 'Vashisht', 'Solang Valley', 'Naggar', 'Kullu Road', 'Aleo', 'Manu Temple Road', 'Hadimba Road', 'Kothi'],
    'Dharamshala': ['McLeod Ganj', 'Naddi', 'Bhagsu Nag', 'Dharamkot', 'Kotwali Bazaar', 'Palampur Road', 'Forsyth Ganj', 'Kangra Road', 'Sidhbari', 'Tapovan'],
    'Dalhousie': ['Subhash Baazaar', 'Garam Sadak', 'Dainkund', 'Khajjiar', 'Bakrota', 'Gandhi Chowk', 'Lakkar Mandi', 'Satdhara', 'Kalloo', 'Panchpula'],
    'Leh': ['Main Bazaar', 'Fort Road', 'Changspa Road', 'Old Road', 'Shanti Stupa', 'Polo Ring Road', 'Skara', 'Shey', 'Spituk', 'Stok'],
    'Srinagar': ['Dal Lake', 'Lal Chowk', 'Mango Market', 'Boulevard Road', 'Gandhi Nagar', 'Rajbagh', 'Sonwar', 'Sadar Bazaar', 'Nowhatta', 'Nigeen Lake'],
    'Gulmarg': ['Gondola Area', 'Golf Course Road', 'Alpather Lake Road', 'Kongdoori', 'Tangmarg', 'Baba Reshi', 'Khilanmarg', 'Ferozepur Nalla', 'Drung', 'Baramulla Road'],
    'Pahalgam': ['Main Market', 'Betaab Valley', 'Aru Valley', 'Lidder River', 'Chandanwari', 'Mamal', 'Sittingnagar', 'Baisaran', 'Dana Pahalgam', 'Pahalgam Golf Course'],
    'Mussoorie': ['Mall Road', 'Library Bazaar', 'Kempty Falls Road', 'Jharipani', 'Barlowganj', 'Happy Valley', 'Clouds End', 'Camels Back Road', 'Sister Bazaar', 'Landour'],
    'Nainital': ['Mall Road', 'Thandi Sadak', 'Tallital', 'Flats Approach Road', 'Ayarpatta', 'Naina Peak Road', 'Kathgodam Road', 'Bhimtal Road', 'Sukhatal', 'Snow View Point'],
    'Rishikesh': ['Laxman Jhula', 'Ram Jhula', 'Tapovan', 'Haridwar Road', 'Shivpuri', 'Neelkanth Road', 'Muni Ki Reti', 'Swarg Ashram', 'Jolly Grant', 'Byasi'],
    'Auli': ['Auli Main Road', 'Gurson Bugyal', 'Tapovan Ski Area', 'Auli Ropeway', 'Chattrakund', 'Kwani Bugyal', 'Nanda Devi View', 'Joshimath Road', 'Auli Lake', 'Cliff Top'],
    'Munnar': ['Munnar Top Station', 'Mattupetty', 'Devikulam', 'Chinnakanal', 'Pothamedu', 'Eravikulam Road', 'Kundala', 'Nestown', 'Vagamon Road', 'Chinnakanal Falls'],
    'Ooty': ['Charing Cross', 'Botanical Garden', 'Lake Road', 'Coonoor Road', 'Ketti Valley', 'Avalanche', 'Emerald', 'Pykara', 'Doddabetta', 'Sheddon Road'],
    'Kodaikanal': ['Coakers Walk', 'Bus Stand Road', 'Pillar Rocks', 'Lakeside Road', 'Green Valley Road', 'Palani Hills', 'Kodai Lake', 'Bryant Park', 'Devil\'s Kitchen', 'Pine Forest'],
    'Coorg': ['Madikeri', 'Kushalnagar', 'Virajpet', 'Gonikoppal', 'Kakkabe', 'Talacauvery', 'Nisargadhama', 'Dubare', 'Bylakuppe', 'Pollibetta'],
    'Darjeeling': ['Mall Road', 'Ghoom', 'Batasia Loop', 'Observatory Hill', 'Chowrasta', 'Lebong', 'Rangit Valley', 'Jore Bunglow', 'Tiger Hill', 'Sonada'],
    'Gangtok': ['MG Marg', 'Lal Bazaar', 'Tadong', 'Ranipool', 'Burtuk', 'Sichey', '6th Mile', '7th Mile', 'Namchi', 'Pelling Road'],
    'Mahabaleshwar': ['Mapro Garden', 'Venna Lake', 'Table Land', 'Lingmala Falls', 'Arthur\'s Seat', 'Elephant\'s Head Point', 'Pratapgad', 'Wai', 'Panchgani Road', 'Babington Point'],
    'Mount Abu': ['Nakki Lake', 'Guru Shikhar', 'Dilwara Temples', 'Sunset Point', 'Main Bazaar', 'Achalgarh', 'Toad Rock', 'Raghunath Temple', 'Adhar Devi', 'Arbuda Mountains'],
}

FIRST_NAMES_M = ['Arjun', 'Rahul', 'Aditya', 'Vikram', 'Rohan', 'Karthik', 'Siddharth', 'Amit', 'Nikhil', 'Priyansh',
    'Deepak', 'Vivek', 'Ravi', 'Sanjay', 'Manish', 'Rajesh', 'Suresh', 'Mahesh', 'Ganesh', 'Prakash']
FIRST_NAMES_F = ['Priya', 'Ananya', 'Neha', 'Kavya', 'Pooja', 'Shreya', 'Ritu', 'Sneha', 'Divya', 'Meera',
    'Aisha', 'Isha', 'Deepa', 'Sunita', 'Geeta', 'Anjali', 'Swati', 'Pallavi', 'Rekha', 'Lakshmi']
LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Singh', 'Rao', 'Iyer', 'Mukherjee',
    'Desai', 'Joshi', 'Kulkarni', 'Pandey', 'Tiwari', 'Mishra', 'Saxena', 'Malhotra', 'Chopra', 'Bhatt']

ALL_AMENITIES = [
    'WiFi', 'Air Conditioning', 'Swimming Pool', 'Free Parking', 'Kitchen',
    'Washing Machine', 'TV', 'Balcony', 'Garden', 'Mountain View',
    'City View', 'Lake View', 'Workspace', 'Gym', 'Security',
    'Power Backup', 'Hot Water', 'Pet Friendly', 'BBQ Area', 'Fireplace'
]

MAJOR_CITY_IMAGES = {
    'Apartment': [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    ],
    'Villa': [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    'House': [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    ],
}

TOURIST_CITY_IMAGES = {
    'Apartment': [
        'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800',
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    ],
    'Villa': [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800',
        'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800',
    ],
    'House': [
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
        'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=800',
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800',
    ],
}

TITLE_PREFIXES = {
    'Villa': ['Luxury', 'Royal', 'Premium', 'Grand', 'Elite', 'Elegant', 'Heritage', 'Serene', 'Enchanting', 'Majestic'],
    'Apartment': ['Modern', 'Urban', 'Skyline', 'Lakefront', 'Panoramic', 'Cozy', 'Stylish', 'Contemporary', 'Sunlit', 'Prime'],
    'House': ['Charming', 'Classic', 'Family', 'Garden', 'Heritage', 'Cozy', 'Spacious', 'Traditional', 'Inviting', 'Pristine'],
}

TITLE_SUFFIXES = {
    'Villa': ['Villa', 'Villa Retreat', 'Villa Haven', 'Villa Estate', 'Villa Paradise'],
    'Apartment': ['Apartment', 'Suite', 'Residence', 'Penthouse', 'Flat'],
    'House': ['House', 'Home', 'Residence', 'Cottage', 'Retreat'],
}

REVIEW_TEMPLATES = [
    ("Amazing stay!", "Absolutely loved our time here. The property was spotless and had everything we needed. The host was very responsive and helpful."),
    ("Great location!", "Perfect location with easy access to all major spots. The views were stunning and the amenities were top-notch."),
    ("Highly recommend!", "One of the best stays we've had. Clean, well-maintained, and beautifully furnished. Would definitely come back."),
    ("Wonderful experience!", "The property exceeded our expectations. Everything from check-in to check-out was smooth. Great value for money."),
    ("Comfortable stay!", "Very comfortable and well-equipped. The kitchen had everything we needed and the beds were super comfy."),
    ("Perfect getaway!", "Ideal place for a relaxing getaway. Peaceful surroundings and great hospitality from the host."),
    ("Excellent property!", "Loved the design and ambiance. The property photos are accurate and the place is even better in person."),
    ("Will return!", "We had such a wonderful time that we're already planning our next visit. The host went above and beyond."),
    ("Fantastic host!", "The host was incredibly accommodating and provided great local tips. The property itself was beautiful."),
    ("Beautiful place!", "Stunning property with amazing attention to detail. Every amenity was available and in working condition."),
    ("Memorable trip!", "Made our trip truly memorable. The property is well-located and beautifully maintained."),
    ("Top-notch!", "Everything about this stay was excellent. From the booking process to the actual stay, no complaints at all."),
    ("Home away from home!", "Felt just like home. The property was warm, welcoming, and had all the comforts we needed."),
    ("Gem of a place!", "A hidden gem! Beautiful property with stunning views and excellent amenities. Highly recommended."),
    ("Superb!", "Superb property in a prime location. The host was very helpful and the stay was fantastic."),
]

GUEST_FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv',
    'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Anvi', 'Prisha', 'Riya', 'Kavya',
    'Rohit', 'Aakash', 'Varun', 'Tarun', 'Nikhil', 'Gaurav', 'Abhishek', 'Rakesh', 'Manoj', 'Vijay']
GUEST_LAST_NAMES = ['Patel', 'Kumar', 'Sharma', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Rao', 'Das', 'Mukherjee',
    'Verma', 'Joshi', 'Pandey', 'Tiwari', 'Mishra', 'Desai', 'Iyer', 'Chatterjee', 'Banerjee', 'Bose']


def get_city_images(city):
    if city in TOURIST_CITIES:
        return TOURIST_CITY_IMAGES
    return MAJOR_CITY_IMAGES


def generate_description(ptype, city, title, nearby):
    descs = {
        'Villa': [
            f"Experience luxury living at this stunning {city} villa. This elegantly designed property features spacious interiors, premium furnishings, and breathtaking views. Perfect for families and groups looking for an upscale retreat.",
            f"A magnificent villa nestled in the heart of {city}. This property offers a perfect blend of modern comfort and traditional charm. Enjoy the spacious garden, private pool, and stunning architecture.",
            f"Indulge in the opulence of this beautifully crafted villa in {city}. Every detail has been thoughtfully curated to provide an unforgettable stay. From the designer interiors to the panoramic views, this property is a true gem.",
        ],
        'Apartment': [
            f"Enjoy urban living at its finest in this stylish {city} apartment. Located in the heart of {nearby}, this modern space offers all the amenities you need for a comfortable stay.",
            f"A contemporary apartment in {city}'s vibrant {nearby} locality. Featuring sleek design, fully equipped kitchen, and stunning city views. Ideal for both business and leisure travelers.",
            f"Welcome to this beautifully appointed apartment in {nearby}, {city}. The space features modern furnishings, high-speed WiFi, and easy access to restaurants, shopping, and entertainment.",
        ],
        'House': [
            f"Welcome to this charming family home in {city}. Located in the peaceful {nearby} area, this property offers a warm and inviting atmosphere with all modern amenities.",
            f"A delightful house in the heart of {nearby}, {city}. This well-maintained property features a beautiful garden, comfortable bedrooms, and a fully equipped kitchen. Perfect for families.",
            f"Experience the warmth of this traditional house in {city}. Situated in the sought-after {nearby} neighborhood, this property combines classic architecture with modern comforts.",
        ],
    }
    return random.choice(descs[ptype])


def create_seed_data():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    # Get existing host user IDs to skip
    cursor.execute("SELECT user_id FROM Hosts")
    existing_host_user_ids = {r['user_id'] for r in cursor.fetchall()}

    # Get existing emails
    cursor.execute("SELECT email FROM Users")
    existing_emails = {r['email'] for r in cursor.fetchall()}

    # Get existing guests
    cursor.execute("SELECT id FROM Guests")
    guest_ids = [r['id'] for r in cursor.fetchall()]

    # If no guests, create some
    if len(guest_ids) < 10:
        print("Creating guest accounts...")
        for i in range(15 - len(guest_ids)):
            fname = random.choice(GUEST_FIRST_NAMES)
            lname = random.choice(GUEST_LAST_NAMES)
            name = f"{fname} {lname}"
            email = f"guest_seed_{i+1}_{random.randint(100,999)}@stayspace.com"
            while email in existing_emails:
                email = f"guest_seed_{i+1}_{random.randint(100,999)}@stayspace.com"
            existing_emails.add(email)
            params = json.dumps({'name': name, 'email': email, 'password': 'Guest@123', 'role': 'Guest'})
            try:
                subprocess.run(
                    [str(CORE_EXE), "auth", "register", params],
                    cwd=str(ROOT_DIR),
                    capture_output=True, text=True, encoding="utf-8",
                    check=False, timeout=10
                )
            except Exception as e:
                print(f"  Guest create warning: {e}")

        cursor.execute("SELECT id FROM Guests")
        guest_ids = [r['id'] for r in cursor.fetchall()]
        print(f"  Total guests: {len(guest_ids)}")

    print(f"Creating 30 new hosts...")

    new_hosts = []

    # 20 Major city hosts
    major_cities_for_hosts = random.sample(MAJOR_CITIES, 20)
    for i, city in enumerate(major_cities_for_hosts):
        gender = random.choice(['Male', 'Female'])
        first = random.choice(FIRST_NAMES_M if gender == 'Male' else FIRST_NAMES_F)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        email = f"host_major_{i+1}_{random.randint(100,999)}@stayspace.com"
        while email in existing_emails:
            email = f"host_major_{i+1}_{random.randint(100,999)}@stayspace.com"
        phone = f"9{random.randint(100000000, 999999999)}"

        params = json.dumps({'name': name, 'email': email, 'password': 'Host@123', 'role': 'Host'})
        try:
            result = subprocess.run(
                [str(CORE_EXE), "auth", "register", params],
                cwd=str(ROOT_DIR),
                capture_output=True, text=True, encoding="utf-8",
                check=False, timeout=10
            )
            if result.returncode == 0:
                resp = json.loads(result.stdout.strip() or "{}")
                if resp.get('status') == 'success':
                    user_id = resp.get('data', {}).get('id')
                    if user_id and user_id not in existing_host_user_ids:
                        cursor.execute(
                            "UPDATE Hosts SET is_approved = TRUE, gender = %s, phone = %s, city = %s WHERE user_id = %s",
                            (gender, phone, city, user_id)
                        )
                        cursor.execute("SELECT id FROM Hosts WHERE user_id = %s", (user_id,))
                        host_row = cursor.fetchone()
                        if host_row:
                            new_hosts.append({'host_id': host_row['id'], 'city': city, 'email': email})
                            print(f"  Created host: {name} ({email}) -> {city}")
        except Exception as e:
            print(f"  Host create warning for {email}: {e}")

    # 10 Tourist city hosts
    tourist_cities_for_hosts = random.sample(TOURIST_CITIES, 10)
    for i, city in enumerate(tourist_cities_for_hosts):
        gender = random.choice(['Male', 'Female'])
        first = random.choice(FIRST_NAMES_M if gender == 'Male' else FIRST_NAMES_F)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        email = f"host_tourist_{i+1}_{random.randint(100,999)}@stayspace.com"
        while email in existing_emails:
            email = f"host_tourist_{i+1}_{random.randint(100,999)}@stayspace.com"
        phone = f"9{random.randint(100000000, 999999999)}"

        params = json.dumps({'name': name, 'email': email, 'password': 'Host@123', 'role': 'Host'})
        try:
            result = subprocess.run(
                [str(CORE_EXE), "auth", "register", params],
                cwd=str(ROOT_DIR),
                capture_output=True, text=True, encoding="utf-8",
                check=False, timeout=10
            )
            if result.returncode == 0:
                resp = json.loads(result.stdout.strip() or "{}")
                if resp.get('status') == 'success':
                    user_id = resp.get('data', {}).get('id')
                    if user_id and user_id not in existing_host_user_ids:
                        cursor.execute(
                            "UPDATE Hosts SET is_approved = TRUE, gender = %s, phone = %s, city = %s WHERE user_id = %s",
                            (gender, phone, city, user_id)
                        )
                        cursor.execute("SELECT id FROM Hosts WHERE user_id = %s", (user_id,))
                        host_row = cursor.fetchone()
                        if host_row:
                            new_hosts.append({'host_id': host_row['id'], 'city': city, 'email': email})
                            print(f"  Created host: {name} ({email}) -> {city}")
        except Exception as e:
            print(f"  Host create warning for {email}: {e}")

    conn.commit()
    print(f"\nCreated {len(new_hosts)} new hosts. Now generating properties...")

    property_count = 0
    used_titles = set()

    for host in new_hosts:
        host_id = host['host_id']
        city = host['city']
        localities = LOCALITIES.get(city, [city + ' Central', city + ' Downtown', city + ' Main'])
        images = get_city_images(city)
        is_tourist = city in TOURIST_CITIES

        for j in range(25):
            ptype = random.choice(['Villa', 'Apartment', 'House'])

            prefix = random.choice(TITLE_PREFIXES[ptype])
            suffix = random.choice(TITLE_SUFFIXES[ptype])
            title = f"{prefix} {suffix} in {city}"
            attempts = 0
            while title in used_titles and attempts < 20:
                prefix = random.choice(TITLE_PREFIXES[ptype])
                suffix = random.choice(TITLE_SUFFIXES[ptype])
                title = f"{prefix} {suffix} in {city}"
                attempts += 1
            if title in used_titles:
                title = f"{prefix} {suffix} in {city} {random.randint(1, 999)}"
            used_titles.add(title)

            locality = random.choice(localities)
            address = f"{random.randint(1, 200)}, {locality}, {city}"

            if ptype == 'Villa':
                bedrooms = random.randint(3, 6)
                bathrooms = random.randint(2, 5)
                beds = random.randint(3, 7)
                max_guests = random.randint(6, 14)
                price = random.randint(4000, 25000)
                prop_size = random.randint(2000, 6000)
            elif ptype == 'Apartment':
                bedrooms = random.randint(1, 3)
                bathrooms = random.randint(1, 3)
                beds = random.randint(1, 4)
                max_guests = random.randint(2, 8)
                price = random.randint(1500, 10000)
                prop_size = random.randint(500, 2500)
            else:
                bedrooms = random.randint(2, 4)
                bathrooms = random.randint(1, 3)
                beds = random.randint(2, 5)
                max_guests = random.randint(4, 10)
                price = random.randint(2000, 12000)
                prop_size = random.randint(1000, 3500)

            image_pool = images[ptype]
            image_url = random.choice(image_pool)

            description = generate_description(ptype, city, title, locality)

            lat = round(random.uniform(8.0, 35.0), 6)
            lng = round(random.uniform(68.0, 97.0), 6)

            try:
                cursor.execute(
                    """INSERT INTO Properties
                    (host_id, title, description, image_url, property_type, address,
                     price_per_night, max_guests, bedrooms, bathrooms, beds,
                     property_size, nearby_location, latitude, longitude)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (host_id, title, description, image_url, ptype, address,
                     price, max_guests, bedrooms, bathrooms, beds,
                     prop_size, locality, lat, lng)
                )
                prop_id = cursor.lastrowid
                property_count += 1

                num_amenities = random.randint(6, 12)
                amenities = random.sample(ALL_AMENITIES, num_amenities)
                if is_tourist and 'Mountain View' not in amenities and random.random() > 0.5:
                    amenities.append('Mountain View')
                if is_tourist and 'Fireplace' not in amenities and ptype == 'Villa' and random.random() > 0.6:
                    amenities.append('Fireplace')
                for amenity in amenities:
                    cursor.execute("INSERT INTO Amenities (property_id, name) VALUES (%s, %s)", (prop_id, amenity))

                num_reviews = random.randint(2, 5)
                for _ in range(num_reviews):
                    g_id = random.choice(guest_ids)
                    rating = random.randint(3, 5)
                    template = random.choice(REVIEW_TEMPLATES)
                    comment = f"{template[1]} The {ptype.lower()} in {locality} was perfect for our needs."
                    days_ago = random.randint(1, 180)
                    cursor.execute(
                        "INSERT INTO Reviews (property_id, guest_id, rating, comment, created_at) VALUES (%s, %s, %s, %s, DATE_SUB(NOW(), INTERVAL %s DAY))",
                        (prop_id, g_id, rating, comment, days_ago)
                    )

            except Exception as e:
                print(f"  Property insert error: {e}")
                continue

        if property_count % 100 == 0 and property_count > 0:
            conn.commit()
            print(f"  ... {property_count} properties created so far")

    conn.commit()
    cursor.close()
    conn.close()
    print(f"\nDone! Created {len(new_hosts)} hosts and {property_count} properties with amenities and reviews.")


if __name__ == '__main__':
    create_seed_data()
