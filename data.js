// ── THABAT HOLDING — MASTER DATA ──
// This file contains all investment, shareholder, and real estate data.
// Edit values here to update the portal. Do NOT put in GitHub repo.

window.__DATA = {

  stats: {
    founded: 1998,
    employees: 700,
    retailStores: 130,
    clients: 20000,
    totalInvestments: 40,
    totalPortfolioFV: 481309004,
    totalCostAmt: 32401179,
    totalRealEstateCost: 14287770,
    totalRealEstateVal: 18499764,
    totalDividends: 240343144
  },

  shareholders: [
    { id:"sh1", name:"Abdullah Almunif", initials:"AA", pct:17.5, role:"Chairman & Group CEO" },
    { id:"sh2", name:"Ali Almunif",      initials:"AL", pct:16.5, role:"Shareholder" },
    { id:"sh3", name:"Ibrahim Almunif",  initials:"IA", pct:16.5, role:"Shareholder" },
    { id:"sh4", name:"Maha Almunif",     initials:"MA", pct:16.5, role:"Shareholder" },
    { id:"sh5", name:"Mari Almunif",     initials:"MR", pct:16.5, role:"Shareholder" },
    { id:"sh6", name:"Munif Almunif",    initials:"MN", pct:16.5, role:"Shareholder" }
  ],

  companies: [
    { id:"c1",  name:"Anoosh",         sector:"Retail",                  geo:"KSA",     year:2003, ownership:70,    cumInv:null,      fvCharter:148014360, fvMarket:226380000, moic:"226.38X", unrealized:226014360, dividends:224457337, status:"active" },
    { id:"c2",  name:"Seedra Fund I",  sector:"VC & Fund",               geo:"KSA",     year:2020, ownership:21.08, cumInv:18299730,  fvCharter:18299730,  fvMarket:38953296,  moic:"2.13X",  unrealized:20653566,  dividends:1502972,  status:"active" },
    { id:"c3",  name:"Seedra Fund II", sector:"VC & Fund",               geo:"KSA",     year:2024, ownership:3.84,  cumInv:1070272,   fvCharter:1070272,   fvMarket:951200,    moic:"0.89X",  unrealized:-119073,   dividends:0,        status:"active" },
    { id:"c4",  name:"9 Round",        sector:"Retail",                  geo:"KSA",     year:2015, ownership:47.95, cumInv:2524417,   fvCharter:1359319,   fvMarket:76720000,  moic:"30.39X", unrealized:74195583,  dividends:3173373,  status:"active" },
    { id:"c5",  name:"Road Logistics", sector:"Logistics & Distribution",geo:"KSA",     year:2010, ownership:25,    cumInv:850000,    fvCharter:4946274,   fvMarket:14750000,  moic:"17.35X", unrealized:13900000,  dividends:822385,   status:"active" },
    { id:"c6",  name:"Matajer",        sector:"Logistics & Distribution",geo:"KSA",     year:2008, ownership:50,    cumInv:null,      fvCharter:null,      fvMarket:null,      moic:null,     unrealized:null,      dividends:0,        status:"active" },
    { id:"c7",  name:"Bedayaat",       sector:"Education",               geo:"KSA",     year:2013, ownership:17,    cumInv:2441284,   fvCharter:null,      fvMarket:2500000,   moic:"1.02X",  unrealized:58716,     dividends:0,        status:"active" },
    { id:"c8",  name:"Jisr",           sector:"SAAS",                    geo:"KSA",     year:2016, ownership:4.55,  cumInv:300000,    fvCharter:6000523,   fvMarket:68250000,  moic:"227.5X", unrealized:67950000,  dividends:4737548,  status:"active" },
    { id:"c9",  name:"Salasa",         sector:"Logistics & Distribution",geo:"KSA",     year:2017, ownership:6.32,  cumInv:1184211,   fvCharter:null,      fvMarket:42660000,  moic:"36.02X", unrealized:41475789,  dividends:5649529,  status:"active" },
    { id:"c10", name:"Kease",          sector:"Hospitality",             geo:"KSA",     year:2021, ownership:16,    cumInv:630000,    fvCharter:null,      fvMarket:3200000,   moic:"5.08X",  unrealized:2570000,   dividends:0,        status:"active" },
    { id:"c11", name:"Prefab",         sector:"Real Estate",             geo:"KSA",     year:2021, ownership:12,    cumInv:330000,    fvCharter:null,      fvMarket:2400000,   moic:"7.27X",  unrealized:2070000,   dividends:0,        status:"active" },
    { id:"c12", name:"Signit",         sector:"SAAS",                    geo:"KSA",     year:2022, ownership:1,     cumInv:187950,    fvCharter:null,      fvMarket:1302083,   moic:"6.93X",  unrealized:1114133,   dividends:0,        status:"active" },
    { id:"c13", name:"404",            sector:"Entertainment",           geo:"KSA",     year:2022, ownership:50,    cumInv:1500000,   fvCharter:null,      fvMarket:1500000,   moic:"1.00X",  unrealized:0,         dividends:0,        status:"active" },
    { id:"c14", name:"18 Degree",      sector:"Retail",                  geo:"KSA",     year:2022, ownership:30,    cumInv:804925,    fvCharter:null,      fvMarket:804925,    moic:"1.00X",  unrealized:0,         dividends:0,        status:"active" },
    { id:"c15", name:"Pipe",           sector:"SAAS",                    geo:"USA",     year:2021, ownership:null,  cumInv:1875000,   fvCharter:null,      fvMarket:937500,    moic:"0.5X",   unrealized:-937500,   dividends:0,        status:"active" },
    { id:"c16", name:"Any Move",       sector:"SAAS",                    geo:"Germany", year:2022, ownership:null,  cumInv:403390,    fvCharter:null,      fvMarket:0,         moic:null,     unrealized:-403390,   dividends:0,        status:"active" }
  ],

  realEstate: [
    { id:"re1", accXero:"12060206", name:"RE SH2 Alkhobar",           details:"Al Khobar - KSA",  date:"Before 2017", costAmt:1200000,  valuation:1200000,  rent:null,   share:33.33, space:"2,500 m²",     status:"active" },
    { id:"re2", accXero:"12060210", name:"RE Ammaria Land – Hamad Alissa", details:"Riyadh - KSA",date:"Before 2017", costAmt:1692142,  valuation:5927078,  rent:null,   share:11.21, space:"176,243 m²",   status:"active" },
    { id:"re3", accXero:"12060204", name:"RE Amirayah Land 1 – Salman",details:"Riyadh - KSA",   date:"Mar-17",      costAmt:1321126,  valuation:1321126,  rent:null,   share:50,    space:"10,000 m²",    status:"active" },
    { id:"re4", accXero:"12060216", name:"RE New Project Maather",    details:"Riyadh - KSA",     date:"Jan-23",      costAmt:1660487,  valuation:1660487,  rent:null,   share:33.33, space:"3,187 m²",     status:"cancelled" },
    { id:"re5", accXero:"12060218", name:"RE Alzahraa – Turkey Alyahia",details:"Riyadh - KSA",  date:"Feb-24",      costAmt:6391074,  valuation:6391074,  rent:null,   share:50,    space:"1,250 m²",     status:"active" },
    { id:"re6", accXero:"12060209", name:"RE Property Ottawa",        details:"Canada",            date:"May-16",      costAmt:2022942,  valuation:2000000,  rent:155451, share:100,   space:"403,317 m²",   status:"active" }
  ],

  sectorAllocation: [
    { sector:"Retail",                  pct:32,   color:"#1A7A4A" },
    { sector:"Real Estate KSA",         pct:21.9, color:"#B8860B" },
    { sector:"Venture Capital & Fund",  pct:23,   color:"#1A5FA8" },
    { sector:"Logistics & Distribution",pct:6,    color:"#C45E00" },
    { sector:"SAAS",                    pct:4,    color:"#6B4FA8" },
    { sector:"Education",               pct:3,    color:"#0A7A72" },
    { sector:"Entertainment",           pct:2,    color:"#C0392B" },
    { sector:"Hospitality",             pct:1,    color:"#2E86AB" },
    { sector:"Modern Construction",     pct:0.2,  color:"#888888" },
    { sector:"Real Estate Outside KSA", pct:7,    color:"#D4A017" }
  ],

  timeline: [
    { year:2003, company:"Anoosh" },
    { year:2008, company:"Matajer Alarabiah" },
    { year:2010, company:"Road Logistics" },
    { year:2013, company:"Bedayaat" },
    { year:2015, company:"9 Round" },
    { year:2016, company:"Jisr" },
    { year:2017, company:"Salasa" },
    { year:2020, company:"Seedra Fund I" },
    { year:2021, company:"Pipe" },
    { year:2021, company:"Kease" },
    { year:2021, company:"Prefab" },
    { year:2022, company:"Signit" },
    { year:2022, company:"404" },
    { year:2022, company:"18 Degree" },
    { year:2022, company:"Any Move" },
    { year:2024, company:"Seedra Fund II" }
  ],

  geoPresence: ["KSA","UAE","Jordan","Kuwait","Egypt","Canada","USA","Germany"],

  documents: []  // Will be populated via upload UI
};
