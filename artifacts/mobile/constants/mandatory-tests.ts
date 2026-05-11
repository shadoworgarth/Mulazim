// Auto-generated from minimum_tests_requirements Excel
  // Mandatory SFDA tests per product category

  export type MandatoryField = "Food" | "Cosmetics";

  export type MandatoryTest = {
    name: string;
    notes?: string;
  };

  export type MandatoryEntry = {
    id: string;
    product: string;
    field: MandatoryField;
    tests: MandatoryTest[];
  };

  export const MANDATORY_TESTS: MandatoryEntry[] = [
  {
    id: "food_0",
    product: "Grains & whole grains, flours, wheat, rice, maize, barley, corn, sorghum",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    { name: "Heavy Metals (As, Pb, Cd)" },
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_1",
    product: "Cereal products (breads, pasta, noodles, tortillas, etc.)",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    { name: "Heavy Metals (As, Pb, Cd)" },
    ],
  },
  {
    id: "food_2",
    product: "Biscuits, cakes, doughs, pastries",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    { name: "Heavy Metals (As, Pb, Cd)" },
    ],
  },
  {
    id: "food_3",
    product: "Breakfast cereals",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    { name: "Heavy Metals (As, Pb, Cd)" },
    ],
  },
  {
    id: "food_4",
    product: "Starch",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    { name: "Heavy Metals (As, Pb, Cd)" },
    ],
  },
  {
    id: "food_5",
    product: "Pulses, Legumes, beans & products",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb, Cd)" },
    ],
  },
  {
    id: "food_6",
    product: "Fresh Vegetables (cucumbers, tomato, etc.)",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    { name: "Pesticides" },
    ],
  },
  {
    id: "food_7",
    product: "Processed Vegetables (frozen/dried/processed/canned)",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb)" },
    ],
  },
  {
    id: "food_8",
    product: "Vegetable juices",
    field: "Food",
    tests: [
    { name: "Pesticides" },
    ],
  },
  {
    id: "food_9",
    product: "Mushrooms, fungi",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb, Cd)" },
    ],
  },
  {
    id: "food_10",
    product: "Leafy Vegetables, leafy herbs, grape leaves, edible flowers",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_11",
    product: "Roots & tubers (Potato, Sweet Potato, Yams, Cassava, Taro)",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_12",
    product: "Fresh Fruits (berries, citrus fruit, etc.)",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb)" },
    ],
  },
  {
    id: "food_13",
    product: "Processed fruits (frozen/dried/processed/canned)",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb)" },
    ],
  },
  {
    id: "food_14",
    product: "Jams, jellies & marmalades",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb)" },
    ],
  },
  {
    id: "food_15",
    product: "Juices (fresh, nectar & fruit drinks)",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Pb)" },
    { name: "Patulin (Apple juice only)" },
    ],
  },
  {
    id: "food_16",
    product: "Nuts & products (almond, pistachio, cashew, walnut, hazelnut)",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    ],
  },
  {
    id: "food_17",
    product: "Seeds & products",
    field: "Food",
    tests: [
    { name: "Mycotoxins (aflatoxins)" },
    ],
  },
  {
    id: "food_18",
    product: "Plant fats & oils (oilseeds, seed oils, margarines)",
    field: "Food",
    tests: [
    { name: "Fatty acid profile" },
    { name: "PAH" },
    ],
  },
  {
    id: "food_19",
    product: "Animal fats & oils (ghee, butter, marine oils)",
    field: "Food",
    tests: [
    { name: "Fatty acid profile" },
    { name: "PAH" },
    ],
  },
  {
    id: "food_20",
    product: "Fish",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Hg)" },
    { name: "Vibrio parahaemolyticus" },
    ],
  },
  {
    id: "food_21",
    product: "Molluscs",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Hg)" },
    { name: "Vibrio parahaemolyticus" },
    ],
  },
  {
    id: "food_22",
    product: "Crustacea",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Hg)" },
    { name: "Vibrio parahaemolyticus" },
    ],
  },
  {
    id: "food_23",
    product: "Processed marine animals (dried, salted, smoked, canned)",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_24",
    product: "Seaweed & algae",
    field: "Food",
    tests: [
    { name: "Heavy Metals (Cadmium)" },
    ],
  },
  {
    id: "food_25",
    product: "All red meat species",
    field: "Food",
    tests: [
    { name: "E. coli" },
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_26",
    product: "Poultry",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    { name: "Campylobacter jejuni" },
    ],
  },
  {
    id: "food_27",
    product: "Offal (Brain, Heart, Kidney, Liver, Lung)",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_28",
    product: "Processed meat products",
    field: "Food",
    tests: [
    { name: "Listeria monocytogenes" },
    ],
  },
  {
    id: "food_29",
    product: "Fresh eggs",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    { name: "Campylobacter jejuni" },
    ],
  },
  {
    id: "food_30",
    product: "Processed eggs (frozen/dried/liquid)",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    { name: "Campylobacter jejuni" },
    ],
  },
  {
    id: "food_31",
    product: "Milk & products",
    field: "Food",
    tests: [
    { name: "E. coli" },
    ],
  },
  {
    id: "food_32",
    product: "Yoghurts & products",
    field: "Food",
    tests: [
    { name: "E. coli" },
    ],
  },
  {
    id: "food_33",
    product: "Cheeses & products",
    field: "Food",
    tests: [
    { name: "Listeria monocytogenes" },
    ],
  },
  {
    id: "food_34",
    product: "Creams & products",
    field: "Food",
    tests: [
    { name: "E. coli" },
    ],
  },
  {
    id: "food_35",
    product: "Sugar (cane sugar, white/brown sugars)",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_36",
    product: "Syrups (glucose syrup, maple syrup, high fructose syrup)",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_37",
    product: "Desserts",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_38",
    product: "Artificial sweeteners",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_39",
    product: "Chewing gum (all types)",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_40",
    product: "Honey",
    field: "Food",
    tests: [
    { name: "Diastase" },
    { name: "Sugars" },
    { name: "HMF" },
    ],
  },
  {
    id: "food_41",
    product: "Bee Pollen, Royal jelly, Propolis, Beeswax",
    field: "Food",
    tests: [
    { name: "Diastase" },
    { name: "Sugars" },
    { name: "HMF" },
    ],
  },
  {
    id: "food_42",
    product: "Soft/carbonated drinks",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_43",
    product: "Flavored artificial drink powders",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_44",
    product: "Energy drinks",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_45",
    product: "Beer & malt beverages",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_46",
    product: "Salts (all types)",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_47",
    product: "Dried Herbs and Spices",
    field: "Food",
    tests: [
    { name: "Additives" },
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_48",
    product: "Condiments and Sauces",
    field: "Food",
    tests: [
    { name: "Additives" },
    { name: "E. coli" },
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_49",
    product: "Leavening agents",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_50",
    product: "Soups & Broths",
    field: "Food",
    tests: [
    { name: "Additives" },
    { name: "E. coli" },
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_51",
    product: "Coffee & products",
    field: "Food",
    tests: [
    { name: "Mycotoxins (Ochratoxin A)" },
    ],
  },
  {
    id: "food_52",
    product: "Tea & products",
    field: "Food",
    tests: [
    { name: "Pesticides" },
    ],
  },
  {
    id: "food_53",
    product: "Herbal infusion & products",
    field: "Food",
    tests: [
    { name: "Mycotoxins (Ochratoxin A)" },
    ],
  },
  {
    id: "food_54",
    product: "Ready-to-eat meals, frozen or chilled meals (pizzas, stuffed pies, sandwiches, etc.)",
    field: "Food",
    tests: [
    { name: "Listeria monocytogenes" },
    { name: "Salmonella" },
    ],
  },
  {
    id: "food_55",
    product: "Infant formulas",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    { name: "Cronobacter spp." },
    { name: "Mycotoxins (Aflatoxins, Ochratoxin A)" },
    { name: "Heavy Metals (As, Pb, Cd)" },
    ],
  },
  {
    id: "food_56",
    product: "Prepared infant foods",
    field: "Food",
    tests: [
    { name: "Mycotoxins (Aflatoxins, Ochratoxin A)" },
    { name: "Heavy Metals (As)" },
    ],
  },
  {
    id: "food_57",
    product: "Infant cereals",
    field: "Food",
    tests: [
    { name: "Salmonella" },
    { name: "Mycotoxins (Aflatoxins, Ochratoxin A)" },
    { name: "Heavy Metals (As)" },
    ],
  },
  {
    id: "food_58",
    product: "Reduced energy foods, diabetic foods, low-sodium food, sport drinks & food",
    field: "Food",
    tests: [
    { name: "Caffeine" },
    { name: "Additives" },
    ],
  },
  {
    id: "food_59",
    product: "Parenteral & enteral feed, therapeutic meal replacements",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_60",
    product: "Dietary supplements",
    field: "Food",
    tests: [
    { name: "Additives" },
    ],
  },
  {
    id: "food_61",
    product: "Bottled drinking water, mineral water",
    field: "Food",
    tests: [
    { name: "E. coli" },
    { name: "Pseudomonas aeruginosa" },
    ],
  },
  {
    id: "food_62",
    product: "Sparkling water",
    field: "Food",
    tests: [
    { name: "E. coli" },
    ],
  },
  {
    id: "food_63",
    product: "Flavored water",
    field: "Food",
    tests: [
    { name: "E. coli" },
    ],
  },
  {
    id: "food_64",
    product: "Ice",
    field: "Food",
    tests: [
    { name: "E. coli" },
    { name: "Pseudomonas aeruginosa" },
    ],
  },
  {
    id: "food_65",
    product: "Raw cocoa",
    field: "Food",
    tests: [
    { name: "Mycotoxins (Ochratoxin A)" },
    ],
  },
  {
    id: "food_66",
    product: "Chocolate products (bars/powder/liquid)",
    field: "Food",
    tests: [
    { name: "Mycotoxins (Ochratoxin A)" },
    ],
  },
  {
    id: "food_67",
    product: "Chocolate confectionary & candies",
    field: "Food",
    tests: [
    { name: "Mycotoxins (Ochratoxin A)" },
    ],
  },
  {
    id: "cos_68",
    product: "Hair Dyes",
    field: "Cosmetics",
    tests: [
    { name: "Determination of Heavy metals" },
    { name: "Determination of Catechol" },
    { name: "Determination of Hydrogen Peroxide" },
    { name: "Determination of p-Phenylenediamine (PPD)" },
    { name: "Determination of Bandrowski base" },
    { name: "Determination of Ammonia", notes: "For Permanent Hair Dye only" },
    ],
  },
  {
    id: "cos_69",
    product: "Hair Care Products (Including Shampoo, Straightener, Spray, Cream and Oil)",
    field: "Cosmetics",
    tests: [
    { name: "Determination of Nitrosamines", notes: "Only if Amines are present in formula" },
    { name: "Determination of Formaldehyde", notes: "Hair straightener products only" },
    { name: "Polycyclic Aromatic Hydrocarbons", notes: "Cream produces and oils products only" },
    { name: "Quinine", notes: "For Hair Growth Stimulant Claims" },
    { name: "Selenium disulphide as selenium", notes: "For anti-dandruff shampoo only" },
    { name: "Determination of 1,4 Dioxane", notes: "Shampoos, Shower gels and Facial cleansers" },
    { name: "Determination of Salicylic acid", notes: "For anti-dandruff shampoo only" },
    { name: "Determination of Methylisothiazolinone (MIT)" },
    { name: "Detection of Minoxidil", notes: "For Hair spray with Hair Growth Stimulant Claims" },
    { name: "Determination of Polymers residues" },
    ],
  },
  {
    id: "cos_70",
    product: "Mouth Care Products (Including toothpaste and mouthwash)",
    field: "Cosmetics",
    tests: [
    { name: "Triclosan", notes: "For Toothpaste only" },
    { name: "Determination of 1,4 Dioxane", notes: "For Toothpaste only" },
    { name: "Fluoride", notes: "For Toothpaste only" },
    { name: "Detection of Alcohol", notes: "For mouthwash only" },
    { name: "Determination of Chlorhexidine", notes: "For mouthwash only" },
    { name: "Determination of Nitrosamines", notes: "Only if Amines are present in formula" },
    { name: "Microbiological Tests" },
    { name: "Determination of Heavy metals" },
    ],
  },
  {
    id: "cos_71",
    product: "Lip Care Products (Including lip stick and lip balm)",
    field: "Cosmetics",
    tests: [
    { name: "Polycyclic Aromatic Hydrocarbons" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Colors" },
    { name: "Determination of Polymers residues" },
    ],
  },
  {
    id: "cos_72",
    product: "Nail Products (Polish and removers)",
    field: "Cosmetics",
    tests: [
    { name: "Dibutyl Phthalate" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Toluene" },
    { name: "Determination of Colors" },
    ],
  },
  {
    id: "cos_73",
    product: "Perfume and Alcohol and aqueous cleansers on wipes",
    field: "Cosmetics",
    tests: [
    { name: "Determination of Methanol" },
    { name: "Determination of MIT/CMIT", notes: "Only for wipes" },
    { name: "Determination of Phthalates (DEP, DBP, DETP)" },
    { name: "Determination of 26 allergens" },
    ],
  },
  {
    id: "cos_74",
    product: "Hand soap",
    field: "Cosmetics",
    tests: [
    { name: "Determination of 1,4 Dioxane" },
    { name: "Microbiological tests" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of 26 allergens" },
    ],
  },
  {
    id: "cos_75",
    product: "Talc Powders",
    field: "Cosmetics",
    tests: [
    { name: "Microbiological Tests" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Boric acid" },
    { name: "Detection of Asbestoses and/or crystalline silica" },
    { name: "Determination of Polymers residues" },
    ],
  },
  {
    id: "cos_76",
    product: "Deodorant, Antiperspirant and Alum",
    field: "Cosmetics",
    tests: [
    { name: "Parabens (Methyl, Butyl and Propyl)", notes: "Only for aqueous non propellant pump, cream roll-on or stick products" },
    { name: "Polycyclic Aromatic Hydrocarbons", notes: "Cream Products only" },
    { name: "Zirconium, Aluminum and Chlorine (AlClH4)", notes: "For non-aerosol antiperspirant only" },
    { name: "Microbiological tests", notes: "Only for aqueous formulations" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Nitrosamines" },
    { name: "Determination of phthalates (DEP, DBP, DETP)" },
    { name: "Determination of 26 allergens" },
    ],
  },
  {
    id: "cos_77",
    product: "Depilatories",
    field: "Cosmetics",
    tests: [
    { name: "Polycyclic Aromatic Hydrocarbons" },
    { name: "Microbiological Tests" },
    { name: "Determination of Sulphide Content" },
    { name: "Determination of 1,4 Dioxane" },
    ],
  },
  {
    id: "cos_78",
    product: "Skin Products (Including skin care, sunscreen, peeling and mineral make up)",
    field: "Cosmetics",
    tests: [
    { name: "Polycyclic Aromatic Hydrocarbons" },
    { name: "Determination of 1,4 Dioxane" },
    { name: "Hydroquinone", notes: "For lightening the skin claims" },
    { name: "Microbiological Tests" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Alpha Hydroxy Acids (AHA)", notes: "Only for Peeling products" },
    { name: "Detection of forbidden UV filters in sunscreens" },
    { name: "Determination of PABA", notes: "Only for sunscreen" },
    { name: "Detection of Lard", notes: "Only for cream and Paste products" },
    { name: "Determination of Colors", notes: "Only for mineral make up" },
    ],
  },
  {
    id: "cos_79",
    product: "Eye Products (Including Eye Makeup and Glue Lashes)",
    field: "Cosmetics",
    tests: [
    { name: "Microbiological Tests" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Silver Nitrate" },
    { name: "Determination of Colors" },
    { name: "Determination of Nitrosamines" },
    { name: "Determination of Polymers residues" },
    ],
  },
  {
    id: "cos_80",
    product: "Henna and Seder",
    field: "Cosmetics",
    tests: [
    { name: "Microbiological Tests" },
    { name: "Determination of Heavy metals" },
    { name: "Determination of Paraphenyldiamine (PPD)", notes: "Only for Henna" },
    { name: "Detection of Ash", notes: "Only for Powder products" },
    { name: "Lawsone" },
    ],
  },
  {
    id: "cos_81",
    product: "Shaving Products (Including shave and after-shave care)",
    field: "Cosmetics",
    tests: [
    { name: "Polycyclic Aromatic Hydrocarbons" },
    { name: "Determination of 1,4 Dioxane" },
    { name: "Microbiological Tests" },
    { name: "Cyclomethicone D4", notes: "Only if formulas containing silicones and Silicone oils" },
    { name: "Determination of 26 allergens" },
    { name: "Determination of Polymers residues" },
    ],
  },
  {
    id: "cos_82",
    product: "Miswak",
    field: "Cosmetics",
    tests: [
    { name: "Microbiological Tests" },
    { name: "Detection of PH" },
    { name: "Determination of Heavy metals" },
    ],
  },
  {
    id: "cos_83",
    product: "Oud (Agar Wood) and other perfumes and fragrance oils",
    field: "Cosmetics",
    tests: [
    { name: "Determination of 26 allergens" },
    { name: "Determination of Phthalates (DIBP, DBP, BBP, DCHP, DEHP, DOP, DINP, DIDP, DETP)" },
    { name: "Determination of Nitromusks (MA, MK, MM, MT, MX)" },
    ],
  },
];
