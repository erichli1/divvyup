## TLDR

Natural language bill splitting by proportion of subtotal paid.

## Problem

Existing bill splitting apps require users to split directly on the total, but tax and tip should be divded proportional to the amount of subtotal paid. Especially on large trips, splitting the bill when some order drinks or want the steaks requires intensive accounting.

## Solution

This billsplitting app turns natural language input into a split bill and shows you the math to prove it. It processes inputs using Llama 3 70B on Groq and then gives you the option to review and edit the identified split. It splits the total cost by the proportion of the subtotal a user paid so that tax and tip are distribued proportionally.

## Setup

`npm i` installs the necessary packages and `npm run dev` runs the app locally. Note this project is built on top of [Convex](https://www.convex.dev/) and running locally or deploying it would require an account there.