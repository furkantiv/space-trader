# Space Engineers Trade Tracker — MVP Brief

## Goal

Build a simple web app for tracking a Space Engineers “trade-only” challenge.

The app should let users record items they bought and sold during episodes, then automatically calculate balance, item summaries, and profit/loss.

The main purpose is to replace a messy spreadsheet with a cleaner trade table.

## Tech Stack

Use:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
  - Auth
  - Database
  - Row Level Security

- Vercel deployment

Do not create a custom backend server.

## Core Idea

Users can create trade tables.

Each trade table represents one challenge/run/save.

Inside a trade table, users add trade entries.

A trade entry is either:

- BUY
- SELL

Each entry has:

- item name
- amount
- unit price
- episode
- optional note

The same item can appear many times.
The app should group and summarize items automatically.

## Required Data

### trade_tables

```ts
id: string
user_id: string
name: string
description?: string
created_at: string
updated_at: string
```

### trade_entries

```ts
id: string
trade_table_id: string
user_id: string
type: "BUY" | "SELL"
item_name: string
amount: number
unit_price: number
episode: number
note?: string
created_at: string
updated_at: string
```

Use Supabase Auth user id for ownership.

Enable RLS so users can only access their own tables and entries.

## Main Pages

### Landing Page

Basic explanation of the app and login/register buttons.

### Dashboard

Shows the user’s trade tables.

User can:

- create table
- open table
- delete table

### Trade Table Page

Main page of the app.

Must include:

- summary cards
- add trade form
- trade entries table
- item summary table

## Trade Form

Fields:

```txt
Type: BUY / SELL
Item Name
Amount
Unit Price
Episode
Note
```

After submit:

- save entry to Supabase
- update displayed summaries
- keep last used episode as default

## Calculations

For each entry:

```ts
totalValue = amount * unit_price;
change = type === "BUY" ? -totalValue : totalValue;
```

Overall balance:

```ts
sum(entry changes)
```

Item summary should group entries by item name.

For each item, calculate:

```txt
total bought amount
total bought value
average buy price
total sold amount
total sold value
average sell price
remaining amount
realized profit/loss
```

For MVP, use average cost method:

```ts
averageBuyPrice = totalBoughtValue / totalBoughtAmount;
estimatedCostOfSoldItems = totalSoldAmount * averageBuyPrice;
realizedProfit = totalSoldValue - estimatedCostOfSoldItems;
```

If sold amount is greater than bought amount, allow it but show a warning.

## UI Requirements

Design should be:

- dark theme
- clean dashboard style
- spreadsheet-like tables
- compact and readable
- desktop-first
- responsive enough for mobile

Positive numbers should look green.
Negative numbers should look red.
Warnings should look amber.

## MVP Features

Build only these first:

- register/login
- create trade table
- list trade tables
- add BUY/SELL entry
- edit entry
- delete entry
- calculate balance
- group entries by item
- show item summary table
- filter by item name
- filter by episode
- protect data with Supabase RLS

## Example Data

```ts
[
	{
		type: "BUY",
		item_name: "Motor",
		amount: 1196,
		unit_price: 5774,
		episode: 8,
	},
	{
		type: "BUY",
		item_name: "Construction Component",
		amount: 4471,
		unit_price: 1459,
		episode: 8,
	},
	{
		type: "BUY",
		item_name: "Interior Plate",
		amount: 2788,
		unit_price: 504,
		episode: 8,
	},
	{
		type: "SELL",
		item_name: "Interior Plate",
		amount: 909,
		unit_price: 585,
		episode: 8,
	},
];
```

Expected balance:

```txt
-14,302,280
```

## Important Notes

Keep the project small.

Do not over-engineer.

Do not add charts, public sharing, CSV import/export, item presets, or advanced reports in the first version.

The first version should simply work as a better spreadsheet for Space Engineers trading.
