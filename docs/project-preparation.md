# Project Preparation Notes

## Current Assumptions

- Working title: `Resume Studio`
- Audience: desktop-first job seekers, with mobile support later
- Architecture: monorepo-style workspace with separate frontend/backend apps
- Local development database: MySQL
- Cache/session helper: Redis

## Initial Domain Areas

- Authentication and user profile
- Resume templates
- Resume editing and preview
- Asset uploads
- Sharing and publishing
- Membership and payment hooks

## What This Scaffold Optimizes For

- Fast local startup
- Clear separation between web, API, and infra
- Room for admin, public site, and editor flows
- Easy migration to future cloud deployment
