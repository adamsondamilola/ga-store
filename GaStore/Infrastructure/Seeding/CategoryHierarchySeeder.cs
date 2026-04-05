using Microsoft.EntityFrameworkCore;
using GaStore.Data.Entities.Products;
using GaStore.Models.Database;

namespace GaStore.Infrastructure.Seeding;

public static class CategoryHierarchySeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("CategoryHierarchySeeder");
        var context = scope.ServiceProvider.GetRequiredService<DatabaseContext>();

        try
        {
            var categories = await context.Categories.ToListAsync(cancellationToken);
            var subCategories = await context.SubCategories.ToListAsync(cancellationToken);
            var productTypes = await context.ProductTypes.ToListAsync(cancellationToken);
            var productSubTypes = await context.ProductSubTypes.ToListAsync(cancellationToken);

            foreach (var categorySeed in SeedData)
            {
                var category = categories.FirstOrDefault(c =>
                    string.Equals(c.Name, categorySeed.Name, StringComparison.OrdinalIgnoreCase));

                if (category == null)
                {
                    category = new Category
                    {
                        Id = Guid.NewGuid(),
                        Name = categorySeed.Name,
                        ImageUrl = categorySeed.ImageUrl,
                        IsActive = true
                    };

                    context.Categories.Add(category);
                    categories.Add(category);
                }

                foreach (var subCategorySeed in categorySeed.SubCategories)
                {
                    var subCategory = subCategories.FirstOrDefault(sc =>
                        sc.CategoryId == category.Id &&
                        string.Equals(sc.Name, subCategorySeed.Name, StringComparison.OrdinalIgnoreCase));

                    if (subCategory == null)
                    {
                        subCategory = new SubCategory
                        {
                            Id = Guid.NewGuid(),
                            CategoryId = category.Id,
                            Name = subCategorySeed.Name,
                            HasColors = subCategorySeed.HasColors,
                            HasSizes = subCategorySeed.HasSizes,
                            HasStyles = subCategorySeed.HasStyles,
                            ImageUrl = subCategorySeed.ImageUrl,
                            IsActive = true
                        };

                        context.SubCategories.Add(subCategory);
                        subCategories.Add(subCategory);
                    }

                    foreach (var typeSeed in subCategorySeed.Types)
                    {
                        var productType = productTypes.FirstOrDefault(pt =>
                            pt.SubCategoryId == subCategory.Id &&
                            string.Equals(pt.Name, typeSeed.Name, StringComparison.OrdinalIgnoreCase));

                        if (productType == null)
                        {
                            productType = new ProductType
                            {
                                Id = Guid.NewGuid(),
                                SubCategoryId = subCategory.Id,
                                Name = typeSeed.Name,
                                ImageUrl = typeSeed.ImageUrl,
                                IsActive = true
                            };

                            context.ProductTypes.Add(productType);
                            productTypes.Add(productType);
                        }

                        foreach (var subTypeSeed in typeSeed.SubTypes)
                        {
                            var productSubType = productSubTypes.FirstOrDefault(pst =>
                                pst.ProductTypeId == productType.Id &&
                                string.Equals(pst.Name, subTypeSeed, StringComparison.OrdinalIgnoreCase));

                            if (productSubType != null)
                            {
                                continue;
                            }

                            productSubType = new ProductSubType
                            {
                                Id = Guid.NewGuid(),
                                ProductTypeId = productType.Id,
                                Name = subTypeSeed,
                                IsActive = true
                            };

                            context.ProductSubTypes.Add(productSubType);
                            productSubTypes.Add(productSubType);
                        }
                    }
                }
            }

            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Category hierarchy seed completed.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Category hierarchy seed failed.");
        }
    }

    private static readonly IReadOnlyList<CategorySeed> SeedData =
    [
        new(
            "Fashion & Apparel",
            [
                new("Men's Clothing",
                    Types:
                    [
                        new("Casual Wear", ["T-Shirts", "Polos", "Shorts", "Jeans", "Joggers", "Hoodies", "Sweatshirts"]),
                        new("Formal Wear", ["Suits", "Blazers", "Dress Shirts", "Trousers", "Ties & Bow Ties"]),
                        new("Traditional / Ethnic Wear", ["Agbada", "Kaftan", "Dashiki", "Senator Wear", "Babariga", "Jalabiya"]),
                        new("Sportswear", ["Jersey Tops", "Track Pants", "Compression Wear", "Cycling Shorts"]),
                        new("Underwear & Socks", ["Briefs", "Boxers", "Vests / Singlets", "Socks", "Thermal Underwear"]),
                        new("Nightwear", ["Pyjamas", "Robes", "Sleep Shorts"])
                    ],
                    HasColors: true,
                    HasSizes: true),
                new("Women's Clothing",
                    Types:
                    [
                        new("Casual Wear", ["Tops & Blouses", "T-Shirts", "Jeans", "Leggings", "Shorts", "Jumpsuits"]),
                        new("Formal Wear", ["Blazers", "Formal Trousers", "Pencil Skirts", "Office Blouses"]),
                        new("Dresses", ["Maxi Dresses", "Mini Dresses", "Midi Dresses", "Bodycon Dresses", "Wrap Dresses", "Party Dresses"]),
                        new("Traditional / Ethnic Wear", ["Ankara Dresses", "Iro & Buba", "Gele & Headwrap", "Lace Gown", "Kaftan", "George Wrapper", "Yoruba Aso-Oke", "Igbo Wrapper Set"]),
                        new("Activewear", ["Sports Bras", "Yoga Pants", "Gym Tops", "Track Suits"]),
                        new("Underwear & Lingerie", ["Bras", "Panties", "Shapewear", "Bodysuits", "Nightgowns", "Camisoles"]),
                        new("Maternity Wear", ["Maternity Tops", "Maternity Dresses", "Maternity Jeans", "Nursing Wear"])
                    ],
                    HasColors: true,
                    HasSizes: true),
                new("Children's Clothing",
                    Types:
                    [
                        new("Baby (0-24 months)", ["Rompers & Onesies", "Baby Sets", "Sleepsuits", "Bibs & Bodysuits"]),
                        new("Toddler (2-5 years)", ["T-Shirts", "Dresses", "Shorts", "Leggings", "Overalls"]),
                        new("Boys (6-14 years)", ["School Uniforms", "Casual Shirts", "Trousers", "Shorts", "Hoodies"]),
                        new("Girls (6-14 years)", ["School Uniforms", "Skirts", "Dresses", "Blouses", "Leggings"]),
                        new("Traditional Children's Wear", ["Kids Agbada", "Kids Ankara Sets", "Kids Kaftan"])
                    ],
                    HasColors: true,
                    HasSizes: true),
                new("Footwear",
                    Types:
                    [
                        new("Men's Shoes", ["Sneakers", "Loafers", "Oxford Shoes", "Sandals", "Boots", "Slippers / Slides", "Canvas"]),
                        new("Women's Shoes", ["Heels", "Flats", "Sneakers", "Sandals", "Wedges", "Ankle Boots", "Mules", "Slippers"]),
                        new("Children's Shoes", ["School Shoes", "Sandals", "Sneakers", "Baby Booties"]),
                        new("Sports Footwear", ["Running Shoes", "Football Boots", "Basketball Sneakers", "Gym Trainers"])
                    ],
                    HasSizes: true),
                new("Bags & Luggage",
                    Types:
                    [
                        new("Handbags", ["Tote Bags", "Clutch Bags", "Satchels", "Crossbody Bags", "Shoulder Bags"]),
                        new("Backpacks", ["School Backpacks", "Laptop Bags", "Hiking Backpacks", "Mini Backpacks"]),
                        new("Luggage & Travel", ["Trolley Bags", "Duffel Bags", "Carry-on Luggage", "Passport Holders"]),
                        new("Men's Bags", ["Briefcases", "Messenger Bags", "Side Bags", "Wallets"])
                    ],
                    HasColors: true),
                new("Accessories",
                    Types:
                    [
                        new("Jewellery", ["Necklaces", "Bracelets", "Earrings", "Rings", "Anklets", "Waist Beads"]),
                        new("Watches", ["Men's Watches", "Women's Watches", "Smartwatches", "Kids Watches"]),
                        new("Headwear", ["Caps & Hats", "Headbands", "Gele / Headwraps", "Bonnets", "Beanies"]),
                        new("Belts & Wallets", ["Men's Belts", "Women's Belts", "Men's Wallets", "Women's Purses"]),
                        new("Eyewear", ["Sunglasses", "Reading Glasses", "Blue-Light Glasses"]),
                        new("Scarves & Wraps", ["Fashion Scarves", "Hijabs", "Pashminas", "Neck Ties"])
                    ],
                    HasColors: true)
            ]),
        new(
            "Okrika & Thrift",
            [
                new("Okrika Clothing",
                    Types:
                    [
                        new("Men's Okrika", ["Grade A Shirts", "Grade A Trousers", "Grade A Jeans", "Grade A Suits & Blazers", "Grade A Jackets & Coats", "Grade A T-Shirts", "Grade A Shorts", "Vintage Tops", "Vintage Tracksuits"]),
                        new("Women's Okrika", ["Grade A Blouses & Tops", "Grade A Dresses", "Grade A Jeans & Trousers", "Grade A Skirts", "Grade A Jackets & Coats", "Vintage Pieces", "Party Dresses (Okrika)"]),
                        new("Children's Okrika", ["Grade A Kids Tops", "Grade A Kids Trousers", "Grade A Kids Dresses", "Kids School Uniforms (Okrika)"]),
                        new("Okrika Sportswear", ["Football Jerseys", "Tracksuits", "Gym Wear", "Basketball Jerseys"])
                    ],
                    HasColors: true,
                    HasSizes: true),
                new("Okrika Footwear",
                    Types:
                    [
                        new("Men's Okrika Shoes", ["Okrika Sneakers", "Okrika Loafers", "Okrika Boots", "Okrika Sandals"]),
                        new("Women's Okrika Shoes", ["Okrika Heels", "Okrika Flats", "Okrika Sneakers", "Okrika Boots"]),
                        new("Children's Okrika Shoes", ["Okrika School Shoes", "Okrika Sneakers (Kids)", "Okrika Sandals (Kids)"])
                    ],
                    HasSizes: true),
                new("Okrika Bags",
                    Types:
                    [
                        new("Women's Okrika Bags", ["Okrika Handbags", "Okrika Tote Bags", "Okrika Clutch Bags"]),
                        new("Men's Okrika Bags", ["Okrika Backpacks", "Okrika Briefcases", "Okrika Duffel Bags"])
                    ]),
                new("Okrika Accessories",
                    Types:
                    [
                        new("Okrika Watches & Jewellery", ["Okrika Watches", "Okrika Jewellery", "Okrika Sunglasses"]),
                        new("Okrika Belts & Wallets", ["Okrika Belts", "Okrika Wallets", "Okrika Scarves"])
                    ]),
                new("Bale Sales (Wholesale)",
                    Types:
                    [
                        new("Clothing Bales", ["Mixed Clothing Bale", "Men's Clothing Bale", "Women's Clothing Bale", "Children's Clothing Bale", "Jeans Bale", "T-Shirt Bale", "Suits & Jackets Bale"]),
                        new("Shoe Bales", ["Mixed Shoe Bale", "Men's Shoe Bale", "Women's Shoe Bale", "Kids Shoe Bale"]),
                        new("Bag Bales", ["Handbag Bale", "Mixed Bag Bale"])
                    ]),
                new("Loose Picks & Mixed Lots")
            ]),
        new(
            "Electronics & Technology",
            [
                new("Phones & Tablets",
                    Types:
                    [
                        new("Smartphones", ["Android Phones", "iPhones", "Budget Phones", "Flagship Phones", "Refurbished Phones"]),
                        new("Tablets", ["Android Tablets", "iPads", "Windows Tablets", "Kids Tablets"]),
                        new("Phone Accessories", ["Phone Cases", "Screen Protectors", "Chargers & Cables", "Power Banks", "Pop Sockets", "Phone Holders"])
                    ]),
                new("Computers & Laptops",
                    Types:
                    [
                        new("Laptops", ["Windows Laptops", "MacBooks", "Chromebooks", "Gaming Laptops", "Refurbished Laptops"]),
                        new("Desktops & All-in-Ones", ["Desktop PCs", "All-in-One PCs", "Mini PCs", "Mac Desktops"]),
                        new("Computer Accessories", ["Keyboards", "Mice", "Monitors", "Webcams", "USB Hubs", "Laptop Bags", "Cooling Pads"]),
                        new("Storage", ["External Hard Drives", "USB Flash Drives", "Memory Cards", "SSDs", "NAS Drives"]),
                        new("Networking", ["Routers", "Modems", "Network Switches", "Wi-Fi Extenders", "Ethernet Cables"])
                    ]),
                new("TV & Home Entertainment",
                    Types:
                    [
                        new("Televisions", ["Smart TVs", "Android TVs", "LED TVs", "OLED TVs", "QLED TVs", "Mini TVs"]),
                        new("Set-Top Boxes & Streaming", ["DSTV Decoders", "GoTV Decoders", "Startimes Decoders", "Amazon Fire Stick", "Android TV Boxes"]),
                        new("Audio & Sound Systems", ["Soundbars", "Home Theatre Systems", "Bluetooth Speakers", "Subwoofers", "Hi-Fi Systems"])
                    ]),
                new("Audio & Headphones",
                    Types:
                    [
                        new("Headphones", ["Over-Ear Headphones", "On-Ear Headphones", "In-Ear Earphones", "TWS Earbuds", "Noise-Cancelling Headphones"]),
                        new("Portable Speakers", ["Bluetooth Speakers", "Waterproof Speakers", "Mini Speakers"]),
                        new("Microphones", ["USB Microphones", "Condenser Mics", "Lavalier Mics", "Podcast Mics"])
                    ]),
                new("Cameras & Photography",
                    Types:
                    [
                        new("Cameras", ["DSLR Cameras", "Mirrorless Cameras", "Point & Shoot Cameras", "Action Cameras", "Instant Cameras"]),
                        new("Camera Accessories", ["Camera Lenses", "Tripods", "Camera Bags", "Memory Cards", "Flash / Speedlights", "Filters"]),
                        new("Drones", ["Consumer Drones", "Professional Drones", "FPV Drones", "Drone Accessories"])
                    ]),
                new("Wearables & Smart Devices",
                    Types:
                    [
                        new("Smartwatches & Bands", ["Apple Watch", "Android Smartwatches", "Fitness Bands", "Kids Smartwatches"]),
                        new("Smart Home Devices", ["Smart Bulbs", "Smart Plugs", "Smart Speakers", "Security Cameras", "Video Doorbells"])
                    ]),
                new("Gaming",
                    Types:
                    [
                        new("Gaming Consoles", ["PlayStation 5", "PlayStation 4", "Xbox Series X/S", "Nintendo Switch"]),
                        new("PC Gaming", ["Gaming PCs", "Gaming Monitors", "Gaming Keyboards", "Gaming Mice", "Gaming Headsets", "Gaming Chairs"]),
                        new("Games & Software", ["PS5 Games", "PS4 Games", "Xbox Games", "Nintendo Games", "PC Games"])
                    ]),
                new("Power & Energy",
                    Types:
                    [
                        new("Inverters & Batteries", ["Inverters", "Inverter Batteries", "Solar Batteries", "UPS Systems"]),
                        new("Solar Products", ["Solar Panels", "Solar Lamps", "Solar Chargers", "Solar Generators"]),
                        new("Generators", ["Petrol Generators", "Gas Generators", "Silent / Inverter Generators"]),
                        new("Extension Cords & Adaptors", ["Extension Boards", "Surge Protectors", "Plug Adaptors", "USB Wall Chargers"])
                    ]),
                new("Printers & Office Tech")
            ]),
        new(
            "Home & Living",
            [
                new("Furniture",
                    Types:
                    [
                        new("Living Room Furniture", ["Sofas & Couches", "Armchairs", "Coffee Tables", "TV Stands", "Bookshelves", "Display Cabinets"]),
                        new("Bedroom Furniture", ["Beds & Bed Frames", "Wardrobes", "Dressing Tables", "Bedside Tables", "Mattresses"]),
                        new("Dining Furniture", ["Dining Tables", "Dining Chairs", "Bar Stools", "Buffets & Sideboards"]),
                        new("Office Furniture", ["Office Desks", "Office Chairs", "Filing Cabinets", "Bookshelves"]),
                        new("Outdoor Furniture", ["Garden Chairs", "Garden Tables", "Hammocks", "Outdoor Sofas", "Sun Loungers"])
                    ]),
                new("Bedding & Bath",
                    Types:
                    [
                        new("Bedding", ["Bed Sheets", "Duvet Sets", "Pillows", "Pillow Cases", "Mattress Protectors", "Blankets & Throws"]),
                        new("Towels & Bath Accessories", ["Bath Towels", "Hand Towels", "Face Towels", "Bathrobes", "Bath Mats", "Shower Curtains"])
                    ]),
                new("Kitchen & Dining",
                    Types:
                    [
                        new("Cookware", ["Pots & Pans", "Non-Stick Cookware", "Casserole Dishes", "Pressure Cookers", "Woks"]),
                        new("Kitchen Appliances", ["Blenders", "Food Processors", "Electric Kettles", "Toasters", "Microwave Ovens", "Air Fryers", "Rice Cookers", "Electric Grills"]),
                        new("Tableware & Dinnerware", ["Plates & Bowls", "Cups & Mugs", "Cutlery Sets", "Serving Platters", "Glassware"]),
                        new("Kitchen Storage & Organisation", ["Food Containers", "Spice Racks", "Pantry Organisers", "Bread Bins"])
                    ]),
                new("Home Decor",
                    Types:
                    [
                        new("Wall Decor", ["Wall Art & Prints", "Mirrors", "Clocks", "Wall Shelves", "Photo Frames"]),
                        new("Lighting", ["Ceiling Lights", "Floor Lamps", "Table Lamps", "LED Strip Lights", "Chandeliers", "Night Lights"]),
                        new("Decorative Accessories", ["Vases & Flowers", "Candles & Holders", "Cushions & Throw Pillows", "Rugs & Carpets", "Curtains & Blinds"])
                    ]),
                new("Cleaning & Laundry",
                    Types:
                    [
                        new("Cleaning Tools", ["Mops & Brooms", "Vacuum Cleaners", "Buckets & Brushes", "Scrubbing Pads"]),
                        new("Laundry", ["Washing Machines", "Laundry Baskets", "Ironing Boards", "Irons", "Clothes Dryers"]),
                        new("Cleaning Products", ["Detergents", "Disinfectants", "Surface Cleaners", "Air Fresheners"])
                    ]),
                new("Storage & Organisation")
            ]),
        new(
            "Beauty & Personal Care",
            [
                new("Skincare",
                    Types:
                    [
                        new("Face Care", ["Face Washes & Cleansers", "Moisturisers", "Serums", "Sunscreen / SPF", "Face Masks", "Eye Creams", "Toners"]),
                        new("Body Care", ["Body Lotions", "Body Oils", "Body Scrubs", "Body Wash", "Shea Butter"]),
                        new("Skin Brightening & Toning", ["Brightening Creams", "Spot Treatments", "Even Skin Tone Products"])
                    ]),
                new("Hair Care",
                    Types:
                    [
                        new("Shampoos & Conditioners", ["Shampoos", "Conditioners", "Co-Wash", "2-in-1 Shampoo"]),
                        new("Hair Treatments", ["Hair Masks", "Leave-in Conditioners", "Hair Oils", "Scalp Treatments", "Hair Growth Products"]),
                        new("Hair Styling", ["Gels & Pomades", "Edge Control", "Hair Sprays", "Heat Protectants", "Relaxers & Texturisers"]),
                        new("Hair Extensions & Wigs", ["Human Hair Wigs", "Synthetic Wigs", "Lace Front Wigs", "Braiding Hair", "Weave & Bundles", "Frontal & Closures"]),
                        new("Hair Tools", ["Blow Dryers", "Flat Irons", "Curling Wands", "Hair Clippers", "Combs & Brushes"])
                    ],
                    HasColors: true),
                new("Makeup & Cosmetics",
                    Types:
                    [
                        new("Face Makeup", ["Foundation", "Concealer", "Powder", "Blush & Bronzer", "Highlighter", "Primer"]),
                        new("Eye Makeup", ["Eyeshadow Palettes", "Eyeliner", "Mascara", "Eyebrow Products", "False Lashes"]),
                        new("Lip Products", ["Lipstick", "Lip Gloss", "Lip Liner", "Lip Balm", "Lip Stain"]),
                        new("Makeup Tools", ["Makeup Brushes", "Beauty Blenders", "Makeup Mirrors", "Organizers"])
                    ],
                    HasColors: true),
                new("Fragrances",
                    Types:
                    [
                        new("Perfumes", ["Men's Perfume", "Women's Perfume", "Unisex Perfume", "Body Mists", "Roll-on Perfume"]),
                        new("Deodorants", ["Roll-on Deodorants", "Spray Deodorants", "Stick Deodorants"])
                    ]),
                new("Men's Grooming",
                    Types:
                    [
                        new("Shaving", ["Shaving Cream & Gel", "Razors & Blades", "Electric Shavers", "Aftershave"]),
                        new("Beard Care", ["Beard Oils", "Beard Balms", "Beard Brushes", "Beard Trimmers"])
                    ]),
                new("Nail Care", Types: [new("Nail Products", ["Nail Polish", "Nail Gels", "Nail Art Accessories", "Nail Files & Buffers", "Nail Clippers", "Artificial Nails"])]),
                new("Spa & Wellness")
            ]),
        new(
            "Food & Groceries",
            [
                new("Fresh Produce",
                    Types:
                    [
                        new("Vegetables", ["Tomatoes", "Peppers", "Onions", "Leafy Greens (Ugwu, Efo, Spinach)", "Okra", "Garden Eggs", "Bitter Leaf", "Waterleaf"]),
                        new("Fruits", ["Bananas", "Oranges", "Pineapple", "Mango", "Watermelon", "Pawpaw / Papaya", "Avocado", "Apples"]),
                        new("Roots & Tubers", ["Yam", "Cassava", "Cocoyam", "Sweet Potatoes", "Irish Potatoes"])
                    ]),
                new("Nigerian Staples & Grains",
                    Types:
                    [
                        new("Grains & Cereals", ["Rice (Ofada, Parboiled, Long Grain)", "Beans (Brown Beans, Black-eyed Peas)", "Maize / Corn", "Millet", "Sorghum (Guinea Corn)", "Oats"]),
                        new("Flours & Swallow Foods", ["Semolina", "Eba / Garri", "Amala (Yam Flour)", "Fufu", "Pounded Yam Flour", "Tuwo Shinkafa", "Wheat Flour"]),
                        new("Pasta & Noodles", ["Spaghetti", "Macaroni", "Indomie Noodles", "Golden Morn", "Pasta Shapes"])
                    ]),
                new("Meat, Poultry & Seafood",
                    Types:
                    [
                        new("Meat", ["Beef", "Goat Meat (Chevon)", "Pork", "Lamb", "Cow Tripe (Shaki)", "Cow Leg (Ika)", "Offal"]),
                        new("Poultry", ["Chicken", "Turkey", "Duck", "Guinea Fowl"]),
                        new("Seafood & Fish", ["Catfish (Clarias)", "Tilapia", "Croaker", "Mackerel (Titus)", "Smoked Fish", "Dried Stockfish (Okporoko)", "Crayfish", "Prawns & Shrimp", "Periwinkle"])
                    ]),
                new("Cooking Ingredients & Spices",
                    Types:
                    [
                        new("Oils & Fats", ["Palm Oil", "Vegetable Oil", "Groundnut Oil", "Coconut Oil", "Butter & Margarine"]),
                        new("Seasoning & Spices", ["Maggi / Knorr Cubes", "Pepper (Suya Spice, Tatashe)", "Curry", "Thyme", "Bay Leaves", "Ogiri / Iru (Locust Beans)", "Uziza Seeds", "Ehuru", "Cameroon Pepper"]),
                        new("Tomato & Pepper Products", ["Tomato Paste", "Canned Tomatoes", "Tomato Puree", "Blended Pepper Mix"])
                    ]),
                new("Packaged & Canned Foods",
                    Types:
                    [
                        new("Canned Goods", ["Canned Tomatoes", "Canned Fish (Sardines, Tuna)", "Canned Beans", "Canned Soups"]),
                        new("Breakfast Foods", ["Cornflakes", "Oats", "Golden Morn", "Milo Cereals", "Bread", "Puff Puff Mix", "Akara Mix"]),
                        new("Snacks & Biscuits", ["Chin-Chin", "Puff-Puff", "Plantain Chips", "Popcorn", "Biscuits (Digestive, Cabin)", "Crackers", "Cookies"])
                    ]),
                new("Beverages",
                    Types:
                    [
                        new("Non-Alcoholic Drinks", ["Water (Table Water, Sachet Water)", "Soft Drinks (Coke, Fanta, Pepsi)", "Juice", "Energy Drinks", "Zobo (Hibiscus Drink)", "Kunu", "Tiger Nut Milk"]),
                        new("Hot Drinks", ["Milo", "Bournvita", "Ovaltine", "Coffee", "Tea", "Cocoa Beverages"]),
                        new("Alcoholic Beverages", ["Beer (Gulder, Star, Heineken)", "Stout (Guinness)", "Wine", "Spirits (Ogogoro, Whisky, Gin)", "Palm Wine"])
                    ]),
                new("Bakery & Confectionery")
            ]),
        new(
            "Health & Wellness",
            [
                new("Vitamins & Supplements",
                    Types:
                    [
                        new("Vitamins", ["Vitamin C", "Vitamin D", "Vitamin B Complex", "Multivitamins", "Vitamin E"]),
                        new("Minerals & Supplements", ["Calcium", "Iron", "Zinc", "Magnesium", "Omega-3 / Fish Oil"]),
                        new("Herbal & Traditional Remedies", ["Moringa Products", "Ginger Supplements", "Turmeric", "Bitter Kola Products", "African Herbal Blends"])
                    ]),
                new("Medical Devices & Equipment",
                    Types:
                    [
                        new("Monitoring Devices", ["Blood Pressure Monitors", "Blood Glucose Meters", "Pulse Oximeters", "Thermometers", "Pregnancy Test Kits"]),
                        new("First Aid", ["First Aid Kits", "Bandages & Dressings", "Antiseptic Solutions", "Gloves & Masks"])
                    ]),
                new("Fitness & Exercise",
                    Types:
                    [
                        new("Gym Equipment", ["Dumbbells", "Barbells", "Resistance Bands", "Pull-up Bars", "Gym Mats", "Jump Ropes"]),
                        new("Cardio Equipment", ["Treadmills", "Exercise Bikes", "Rowing Machines", "Ellipticals"]),
                        new("Sportswear & Equipment", ["Sports Shoes", "Gym Clothes", "Water Bottles", "Gym Bags"])
                    ]),
                new("Sexual Health & Family Planning",
                    Types:
                    [
                        new("Contraceptives", ["Condoms", "Contraceptive Pills"]),
                        new("Fertility & Pregnancy", ["Ovulation Test Kits", "Prenatal Vitamins", "Pregnancy Pillows"])
                    ]),
                new("Pharmacy Essentials")
            ]),
        new(
            "Baby & Kids",
            [
                new("Baby Feeding",
                    Types:
                    [
                        new("Feeding Essentials", ["Baby Formula", "Breast Pumps", "Feeding Bottles", "Sippy Cups", "Bibs", "Spoons & Bowls"]),
                        new("Baby Food", ["Infant Cereal", "Pureed Baby Food", "Snacks for Toddlers", "Teething Biscuits"])
                    ]),
                new("Baby Gear & Safety",
                    Types:
                    [
                        new("Travel & Mobility", ["Prams & Strollers", "Baby Carriers", "Car Seats", "Baby Bouncers"]),
                        new("Sleep & Furniture", ["Baby Cots & Cribs", "Moses Baskets", "Baby Monitors", "Sleeping Bags"]),
                        new("Bathing & Hygiene", ["Baby Baths", "Baby Shampoo", "Baby Lotion", "Nappies / Diapers", "Baby Wipes", "Nappy Cream"])
                    ]),
                new("Toys & Games",
                    Types:
                    [
                        new("Baby Toys (0-2 years)", ["Rattles", "Soft Toys", "Teething Toys", "Activity Mats"]),
                        new("Educational Toys", ["Building Blocks", "Puzzles", "Learning Tablets", "Art & Craft Sets", "Flash Cards"]),
                        new("Outdoor & Active Play", ["Bicycles", "Scooters", "Footballs", "Swing Sets", "Skipping Ropes"]),
                        new("Electronic Toys & Games", ["RC Cars", "Video Games (Kids)", "Kids Tablets", "Robotic Toys"])
                    ]),
                new("Kids Fashion", HasColors: true, HasSizes: true)
            ]),
        new(
            "Sports & Outdoors",
            [
                new("Team Sports",
                    Types:
                    [
                        new("Football / Soccer", ["Footballs", "Football Boots", "Goal Posts", "Goalkeeper Gloves", "Football Kits"]),
                        new("Basketball", ["Basketballs", "Basketball Shoes", "Basketball Hoops", "Basketball Jerseys"]),
                        new("Volleyball", ["Volleyballs", "Volleyball Nets", "Knee Pads"]),
                        new("Table Tennis", ["Table Tennis Tables", "Paddles & Bats", "Table Tennis Balls"])
                    ]),
                new("Individual Sports",
                    Types:
                    [
                        new("Tennis & Badminton", ["Tennis Rackets", "Badminton Rackets", "Shuttlecocks", "Tennis Balls", "Tennis Shoes"]),
                        new("Boxing & Martial Arts", ["Boxing Gloves", "Punching Bags", "Head Guards", "Mouthguards", "Martial Arts Uniforms"]),
                        new("Swimming", ["Swimwear", "Goggles", "Swimming Caps", "Kickboards"]),
                        new("Chess & Board Games", ["Chess Sets", "Checkers", "Ludo", "Scrabble"])
                    ]),
                new("Outdoor Recreation",
                    Types:
                    [
                        new("Camping", ["Tents", "Sleeping Bags", "Camping Stoves", "Torches & Lanterns", "Camping Chairs"]),
                        new("Cycling", ["Road Bikes", "Mountain Bikes", "BMX Bikes", "Cycling Helmets", "Cycling Accessories"]),
                        new("Fishing", ["Fishing Rods", "Fishing Lines", "Reels", "Lures & Bait", "Tackle Boxes"])
                    ]),
                new("Fitness Apparel", HasColors: true, HasSizes: true)
            ]),
        new(
            "Automotive",
            [
                new("Car Parts & Spares",
                    Types:
                    [
                        new("Engine & Transmission", ["Engine Oil", "Filters (Oil, Air, Fuel)", "Spark Plugs", "Belts & Hoses", "Gaskets"]),
                        new("Body Parts", ["Bumpers", "Doors", "Bonnets", "Side Mirrors", "Windscreens"]),
                        new("Brakes & Suspension", ["Brake Pads", "Rotors & Discs", "Shock Absorbers", "Coil Springs"]),
                        new("Tyres & Wheels", ["Car Tyres", "Alloy Wheels", "Spare Wheels", "Wheel Caps"]),
                        new("Electrical & Batteries", ["Car Batteries", "Alternators", "Starters", "Headlights", "Tail Lights"])
                    ]),
                new("Car Accessories",
                    Types:
                    [
                        new("Interior Accessories", ["Seat Covers", "Steering Wheel Covers", "Car Mats", "Dashboard Mats", "Car Air Fresheners"]),
                        new("Exterior Accessories", ["Car Covers", "Roof Racks", "Tow Bars", "Bull Bars"]),
                        new("Car Electronics", ["Car Radios & Stereos", "Car Cameras / Dash Cams", "GPS Trackers", "Reversing Cameras", "Car Chargers"]),
                        new("Car Care", ["Car Wash Soap", "Wax & Polish", "Tyre Shine", "Glass Cleaner"])
                    ]),
                new("Motorcycles & Okada Parts",
                    Types:
                    [
                        new("Motorcycle Parts", ["Motorcycle Tyres", "Motorcycle Chains", "Brake Pads", "Engine Parts", "Exhaust Systems"]),
                        new("Motorcycle Accessories", ["Helmets", "Riding Gloves", "Riding Jackets", "Rear Boxes / Carriers"]),
                        new("Tricycles (Keke Napep) Parts", ["Keke Engines", "Keke Tyres", "Keke Body Parts", "Keke Electrical"])
                    ]),
                new("Vehicle Services")
            ]),
        new(
            "Office & Stationery",
            [
                new("Writing & Stationery",
                    Types:
                    [
                        new("Writing Instruments", ["Pens", "Pencils", "Markers & Highlighters", "Whiteboard Markers", "Fountain Pens"]),
                        new("Paper Products", ["A4 Papers", "Exercise Books", "Notebooks", "Sticky Notes", "Envelopes"]),
                        new("Filing & Organisation", ["Folders", "File Binders", "Staples & Staplers", "Punches", "Tape & Dispensers", "Scissors"])
                    ]),
                new("Office Equipment",
                    Types:
                    [
                        new("Printing & Copying", ["Printers", "Ink Cartridges", "Toners", "Scanners", "Photocopiers"]),
                        new("Telecommunication", ["Office Phones", "PABX Systems", "Intercom Systems"]),
                        new("Presentation", ["Whiteboards", "Projectors", "Projector Screens", "Flipcharts"])
                    ]),
                new("School Supplies",
                    Types:
                    [
                        new("School Essentials", ["School Bags", "Math Sets & Geometry Kits", "Rulers & Set Squares", "Pencil Cases", "Scientific Calculators"]),
                        new("Art & Craft Supplies", ["Coloured Pencils", "Crayons", "Paints", "Canvases", "Glue & Adhesives"])
                    ]),
                new("Office Furniture")
            ]),
        new(
            "Books, Music & Movies",
            [
                new("Books",
                    Types:
                    [
                        new("Fiction", ["African Literature", "Nollywood Novelizations", "Romance", "Thrillers", "Science Fiction", "Fantasy"]),
                        new("Non-Fiction", ["Business & Finance", "Self Help", "History", "Health & Medicine", "Biographies", "Politics"]),
                        new("Educational & Academic", ["Primary School Textbooks", "Secondary School Textbooks", "University Textbooks", "WAEC / NECO / JAMB Prep Books", "Professional Certifications"]),
                        new("Children's Books", ["Picture Books", "Story Books", "Activity Books", "Educational Books (Kids)"]),
                        new("Religious Books", ["Bibles", "Qurans", "Christian Literature", "Islamic Literature"])
                    ]),
                new("Musical Instruments",
                    Types:
                    [
                        new("String Instruments", ["Acoustic Guitars", "Electric Guitars", "Bass Guitars", "Violins", "Ukuleles"]),
                        new("Keyboard & Piano", ["Digital Pianos", "MIDI Keyboards", "Electronic Organs", "Synthesizers"]),
                        new("Percussion", ["Drums", "Djembe", "Talking Drums", "Tambourines", "Shakers"]),
                        new("Wind Instruments", ["Flutes", "Trumpets", "Saxophones", "Harmonicas"]),
                        new("DJ & Studio Equipment", ["DJ Controllers", "Audio Interfaces", "Studio Monitors", "MIDI Controllers", "Mixers"])
                    ]),
                new("Movies & Media")
            ]),
        new(
            "Agriculture & Farming",
            [
                new("Farming Tools & Equipment",
                    Types:
                    [
                        new("Hand Tools", ["Hoes", "Cutlasses (Machetes)", "Rakes", "Shovels & Spades", "Wheelbarrows", "Hand Pumps"]),
                        new("Power Equipment", ["Tractors", "Tillers & Cultivators", "Water Pumps", "Irrigation Systems", "Motorized Sprayers"]),
                        new("Harvesting & Processing", ["Cassava Graters", "Threshing Machines", "Palm Oil Presses", "Maize Shellers", "Groundnut Shellers"])
                    ]),
                new("Seeds & Seedlings",
                    Types:
                    [
                        new("Food Crop Seeds", ["Maize Seeds", "Rice Seeds", "Tomato Seeds", "Pepper Seeds", "Vegetable Seeds"]),
                        new("Tree & Cash Crop Seedlings", ["Oil Palm Seedlings", "Cocoa Seedlings", "Plantain Suckers", "Cassava Stems", "Yam Setts"])
                    ]),
                new("Agro-Chemicals & Fertilisers",
                    Types:
                    [
                        new("Fertilisers", ["NPK Fertiliser", "Urea", "Organic Compost", "Foliar Fertilisers"]),
                        new("Pesticides & Herbicides", ["Herbicides (Roundup)", "Insecticides", "Fungicides", "Rodenticides"])
                    ]),
                new("Livestock & Poultry",
                    Types:
                    [
                        new("Animal Feed", ["Poultry Feed (Layers, Broilers)", "Fish Feed", "Cattle Feed", "Pig Feed", "Goat Feed"]),
                        new("Veterinary Supplies", ["Vaccines", "Dewormers", "Antibiotics (Vet)", "Vitamins (Vet)", "Poultry Drinkers & Feeders"]),
                        new("Aquaculture", ["Fish Fingerlings", "Fish Ponds", "Aerators", "Fish Feed (Catfish, Tilapia)"])
                    ]),
                new("Farm Produce")
            ]),
        new(
            "Building & Construction",
            [
                new("Building Materials",
                    Types:
                    [
                        new("Cement & Concrete", ["Portland Cement", "Dangote Cement", "BUA Cement", "Concrete Blocks", "Gravel & Sand"]),
                        new("Iron & Steel", ["Iron Rods (Rebar)", "Steel Sheets", "Roofing Sheets (Corrugated, Longspan)", "Galvanized Sheets", "Purlins & Angles"]),
                        new("Wood & Timber", ["Plank Timber", "Plywood", "Chipboard", "Hardwood", "Bamboo"]),
                        new("Roofing & Ceilings", ["Roof Tiles", "PVC Ceiling", "POP Ceiling", "Roofing Nails & Screws", "Fascia Boards"]),
                        new("Pipes & Plumbing", ["PVC Pipes", "PPR Pipes", "Galvanized Pipes", "Water Tanks (Polytank)", "Tap & Valves", "WC & Toilet Fittings", "Sinks & Basins"]),
                        new("Paints & Coatings", ["Emulsion Paint", "Gloss Paint", "Exterior Paint", "Primer & Undercoat", "Wood Stain & Varnish", "Texture Paint"]),
                        new("Tiles & Flooring", ["Ceramic Tiles", "Porcelain Tiles", "Vitrified Tiles", "Terrazzo", "Vinyl Flooring", "Parquet / Wooden Floor"])
                    ]),
                new("Hardware & Tools",
                    Types:
                    [
                        new("Hand Tools", ["Hammers", "Screwdrivers", "Spanners & Wrenches", "Measuring Tapes", "Pliers", "Chisels & Files"]),
                        new("Power Tools", ["Drills", "Angle Grinders", "Circular Saws", "Jigsaws", "Welding Machines", "Generators (Construction)"]),
                        new("Fasteners & Fixings", ["Nails", "Screws & Bolts", "Nuts & Washers", "Anchors & Rawl Plugs", "Adhesives & Sealants"]),
                        new("Safety Equipment", ["Hard Hats", "Safety Boots", "Reflective Vests", "Safety Goggles", "Gloves (Work)", "Dust Masks"])
                    ]),
                new("Electrical Materials",
                    Types:
                    [
                        new("Wiring & Cables", ["Electrical Cables", "Conduit Pipes", "Cable Trays", "Junction Boxes"]),
                        new("Switches & Sockets", ["Wall Switches", "Wall Sockets", "Circuit Breakers (MCB)", "Distribution Boards"]),
                        new("Lighting & Fittings", ["LED Bulbs", "Fluorescent Tubes", "Ceiling Fans", "Outdoor Security Lights", "Flood Lights"])
                    ]),
                new("Doors & Windows")
            ]),
        new(
            "Services & Digital Goods",
            [
                new("Airtime & Data",
                    Types:
                    [
                        new("Airtime Top-up", ["MTN Airtime", "Airtel Airtime", "Glo Airtime", "9mobile Airtime"]),
                        new("Data Plans", ["MTN Data", "Airtel Data", "Glo Data", "9mobile Data", "Spectranet", "Smile Data"])
                    ]),
                new("Bills & Utilities",
                    Types:
                    [
                        new("Electricity", ["IKEDC Token", "EKEDC Token", "AEDC Token", "PHEDC Token", "EEDC Token"]),
                        new("TV Subscription", ["DSTV Subscription", "GoTV Subscription", "Startimes Subscription", "Showmax", "Netflix Gift Cards"]),
                        new("Internet Bills", ["SWIFT Subscription", "Spectranet Bills", "Home Fibre Bills"])
                    ]),
                new("Gift Cards & Vouchers",
                    Types:
                    [
                        new("Shopping Gift Cards", ["Jumia Gift Card", "Konga Gift Card", "Amazon Gift Card"]),
                        new("Gaming Gift Cards", ["PlayStation Store Cards", "Xbox Gift Cards", "Steam Wallet Codes", "Google Play Cards", "Apple iTunes Cards"])
                    ]),
                new("Software & Licences",
                    Types:
                    [
                        new("Operating Systems", ["Windows 11 Licence", "macOS Software"]),
                        new("Productivity Software", ["Microsoft Office 365", "Adobe Creative Cloud", "Antivirus Licences"])
                    ]),
                new("Professional Services")
            ]),
        new(
            "Pets & Pet Supplies",
            [
                new("Dogs",
                    Types:
                    [
                        new("Dog Food", ["Dry Dog Food", "Wet Dog Food", "Dog Treats & Chews", "Puppy Food"]),
                        new("Dog Accessories", ["Collars & Leashes", "Dog Crates & Cages", "Dog Beds", "Dog Clothing", "Muzzles"]),
                        new("Dog Health", ["Dog Dewormers", "Flea & Tick Treatment", "Dog Vitamins", "Dog Shampoo"])
                    ]),
                new("Cats",
                    Types:
                    [
                        new("Cat Food", ["Dry Cat Food", "Wet Cat Food", "Cat Treats"]),
                        new("Cat Accessories", ["Litter & Litter Boxes", "Cat Beds", "Cat Toys", "Scratching Posts", "Cat Collars"])
                    ]),
                new("Birds & Fish",
                    Types:
                    [
                        new("Bird Supplies", ["Bird Cages", "Bird Feed", "Bird Perches & Toys"]),
                        new("Aquarium & Fish", ["Aquarium Tanks", "Fish Food", "Filters & Pumps", "Aquarium Decoration"])
                    ]),
                new("Small Pets")
            ]),
        new(
            "Industrial & Scientific",
            [
                new("Laboratory Supplies",
                    Types:
                    [
                        new("Lab Equipment", ["Microscopes", "Centrifuges", "Beakers & Flasks", "Weighing Scales"]),
                        new("Safety & Protective Gear", ["Lab Coats", "Safety Goggles", "Chemical Gloves", "Respirators"])
                    ]),
                new("Industrial Tools",
                    Types:
                    [
                        new("Measurement Tools", ["Calipers", "Multimeters", "Laser Levels", "Pressure Gauges"]),
                        new("Workshop Equipment", ["Air Compressors", "Bench Grinders", "Hydraulic Jacks", "Tool Cabinets"])
                    ]),
                new("Consumables")
            ]),
        new(
            "Party, Gifts & Events",
            [
                new("Party Supplies",
                    Types:
                    [
                        new("Decorations", ["Balloons", "Banners", "Table Covers", "Centerpieces"]),
                        new("Disposable Partyware", ["Paper Plates", "Cups", "Napkins", "Plastic Cutlery"])
                    ]),
                new("Gifts",
                    Types:
                    [
                        new("Gift Sets", ["Chocolate Hampers", "Spa Gift Sets", "Corporate Gift Boxes"]),
                        new("Wrapping", ["Gift Bags", "Wrapping Paper", "Ribbons", "Gift Tags"])
                    ]),
                new("Event Services")
            ])
    ];

    private sealed record CategorySeed(
        string Name,
        IReadOnlyList<SubCategorySeed> SubCategories,
        string? ImageUrl = null);

    private sealed record SubCategorySeed(
        string Name,
        IReadOnlyList<TypeSeed>? Types = null,
        bool HasColors = false,
        bool HasSizes = false,
        bool HasStyles = false,
        string? ImageUrl = null)
    {
        public IReadOnlyList<TypeSeed> Types { get; init; } = Types ?? [];
    }

    private sealed record TypeSeed(
        string Name,
        IReadOnlyList<string>? SubTypes = null,
        string? ImageUrl = null)
    {
        public IReadOnlyList<string> SubTypes { get; init; } = SubTypes ?? [];
    }
}
