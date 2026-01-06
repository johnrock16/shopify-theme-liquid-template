# Shopify Liquid Theme: Amanhecer (Dawn Based)
> A modern, extensible Shopify Liquid theme architecture built on top of **Dawn**, focused on scalability, maintainability, and advanced frontend workflows without breaking Shopify’s native conventions.

Developed as an architectural and portfolio project focused on:

- scalability
- maintainability
- clean abstractions
- real-world Shopify constraints

## ✨ Overview
**Amanhecer** is an architectural extension of the official Dawn theme.
It keeps **Dawn** as its foundation while introducing a modern development layer that enables:

- ES6 module-based JavaScript
- Vite-powered build pipeline
- Tailwind CSS support
- A structured style guide
- A scalable analytics and validation architecture
- Reusable platform-agnostic libraries

This project is **not a fork that replaces Dawn**, but an **extension** that evolves on top of it while remaining compatible with Shopify updates.

## 🎯 Goals
- Extend Dawn without breaking Shopify conventions
- Introduce a modern JS/CSS workflow (Vite + ES Modules)
- Provide a scalable pattern for analytics and validation
- Enable long-term maintainability for growing teams

## 🚫 Non-Goals
- Replace Shopify’s theme system
- Break compatibility with Dawn updates

## 🛠️ Tech Stack

### Shopify & Theme
- Shopify Liquid
- Dawn (base theme)

### Frontend

- Vite
- ES6 Modules
- Tailwind CSS

### Architecture & Libraries

- **check-rule-mate**: Rule-based validation engine
- **check-rule-mate-form**: Front-end form validation abstraction
- **check-rule-mate-form-liquid**: Drag-and-drop form component with rule-based validation
- **data-layer-manager**: Platform-agnostic analytics/dataLayer abstraction
- **vite-plugin-shopify-icons**: Custom icon library

## 📦 Key Features

### ⚡ Vite Integration
- Modern build pipeline
- Tree-shaking and minification
- NPM dependency support
- Multiple entry points for Shopify sections/templates

### 🎨 Style Guide
- Centralized design tokens
- Consistent UI patterns
- Tailwind-based utilities
- Easier onboarding for new developers

### 🧪 Validation Layer
- Rule-based validation
- Decoupled business logic
- Reusable across platforms (Shopify, headless, apps)

### 📊 Analytics & Tracking
- Structured dataLayer architecture
- Event-driven analytics
- Separation between Liquid rendering and tracking logic
- Compatible with GA4 / GTM

## ❓ Why Amanhecer?

Shopify themes scale well for small stores, but tend to become hard to maintain when:
- multiple developers work on the same theme
- complex forms and validations are required
- analytics logic spreads across Liquid files
- JavaScript grows without structure

Amanhecer exists to solve these problems while staying inside Shopify’s theme constraints.


## 🚀 Who Is This For?
- Shopify developers
- Agencies maintaining large or long-lived themes
- Teams facing scaling issues with Liquid-based architectures
- Engineers bringing modern frontend practices to Shopify

## 📖 Documentation
More documentation will be added covering:

- Architecture decisions
- Vite configuration
- Validation patterns
- Analytics conventions

## See also
- [Dawn Theme](https://github.com/Shopify/dawn)
- [check-rule-mate](https://github.com/johnrock16/check-rule-mate)
- [check-rule-mate-form](https://github.com/johnrock16/check-rule-mate-form)
- [data-layer-manager](https://github.com/johnrock16/data-layer-manager)
- [vite-plugin-shopify-icons-liquid](https://github.com/johnrock16/vite-plugin-shopify-icons-liquid)