# AgriSaathi

### Strengthening Market Linkages and Price Discovery for Farmers

AgriSaathi is a digital agricultural marketplace designed to connect **farmers, buyers, and logistics providers** through a transparent produce-trading workflow.

The platform enables farmers to list their produce, buyers to discover available commodities and submit competitive offers, farmers to accept offers, and both parties to track confirmed transactions and pickup logistics.

AgriSaathi also integrates **mandi market-price data** to support informed pricing decisions and improve price discovery.

> **SIH 2026 — Problem Statement SIH26132**
> **Theme:** Agriculture, FoodTech & Rural Development
> **Sponsor:** Government of Maharashtra
> **Track:** Software

---

## Overview

Traditional agricultural markets can involve multiple intermediaries, limited price visibility, fragmented buyer networks, and logistical uncertainty.

AgriSaathi addresses these challenges by providing a single digital workflow:

```text
Farmer
   │
   ├── Create Produce Listing
   │
   ▼
Marketplace
   │
   ├── Market Price Reference
   │
   ▼
Buyer
   │
   ├── Submit Offer
   │
   ▼
Farmer
   │
   ├── Accept / Reject Offer
   │
   ▼
Confirmed Transaction
   │
   ▼
Pickup & Logistics
```

The system is designed as an MVP demonstrating the complete marketplace lifecycle rather than attempting to replace existing agricultural supply chains.

---

## Key Features

### 🌾 Farmer Marketplace

* Create produce listings
* Specify crop, variety, quantity and expected price
* Specify harvest and pickup information
* View all personal listings
* Monitor incoming buyer offers
* Accept or reject offers
* View confirmed transactions
* Track pickup and logistics requests

### 🤝 Buyer Marketplace

* Browse currently active produce listings
* Submit competitive offers
* Specify offered price and quantity
* Include a message with an offer
* Track submitted offers
* View accepted and rejected offers
* View confirmed purchases
* Track pickup and delivery information

### 📊 Market Price Discovery

AgriSaathi integrates mandi price information to help users make better pricing decisions.

The market-price module provides:

* Crop filtering
* District filtering
* Market search
* Minimum price
* Modal price
* Maximum price
* Arrival quantity when available
* Market/date information
* Pagination
* Data-source attribution

The current implementation uses Maharashtra market data sourced through the Governm
