# Chaukidar Product Specification

## Positioning

Chaukidar is a B2B multilingual AI safety audit platform for companies deploying LLM and RAG chatbots in South Asian markets.

## Core Thesis

English-only AI safety testing misses regional language risk. Translation-based testing is useful, but native/culturally adapted red-team prompts expose failures that simple translation often misses.

## MVP

- 4 languages: Urdu, Punjabi/Shahmukhi, Pashto, Sindhi
- 5-6 high-level harm categories
- sanitized prompt records only
- translation baseline prompt track
- native-adapted prompt track
- model/RAG target registration
- audit runs
- judge labels and risk scores
- report JSON
- AMD notebook result import

## AMD Usage

The AMD Jupyter notebook is used to run or benchmark model inference. The repo stores benchmark evidence and imported audit JSON to show meaningful AMD platform usage for Track 3.

## Safety Constraints

Public data, logs, reports, and demo views must avoid operational harmful content. The system stores sanitized placeholders and intent summaries.
