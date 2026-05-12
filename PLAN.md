# Peys OS — Improvement Plan

Based on architectural audit, here are the 8 prioritized issues to address:

## Issue 1: Smart Contract Upgradeability (UUPS Proxy)
PeysEscrow.sol is not upgradeable. Wrap it in a UUPS proxy pattern (OpenZeppelin) so bugs can be fixed and features added without full migrations.

## Issue 2: Simplify Commit-Reveal Scheme
The 2-minute commit-reveal delay adds UX friction. Replace with private mempool submission (Flashbots/MEV-Share) or ERC-4337 user ops that are naturally private.

## Issue 3: Internal Service Auth Hardening
Edge functions call each other using `SUPABASE_SERVICE_ROLE_KEY` passed via HTTP headers. Use Supabase's internal function invocation or per-function scoped keys.

## Issue 4: Backend Consolidation to Supabase Edge Functions
Three backend codebases coexist (Express, Fastify, Edge Functions). Commit fully to Edge Functions for lower cost and simpler maintenance.

## Issue 5: Deploy to Base Mainnet
All contracts on testnets only. Ship to Base mainnet — highest stablecoin liquidity, lowest fees, Coinbase distribution.

## Issue 6: ERC-4337 Paymaster for Gasless Claims
Recipients shouldn't need ETH for gas or wait 2 minutes. Add ERC-4337 account abstraction with paymaster sponsorship.

## Issue 7: WhatsApp Cloud API Migration
Current bot uses `@whiskeysockets/baileys` (unofficial). Finish migrating to Meta's official Cloud API.

## Issue 8: Feature Scope Reduction
96+ pages is too broad. Strip to core send→claim flow until PMF is validated.

---

*This file will be deleted once all items are completed.*
