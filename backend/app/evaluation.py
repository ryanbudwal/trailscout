"""Small, reproducible semantic retrieval evaluation for the authored catalogue."""

import re
from statistics import mean

from .database import PUBLIC_COLUMNS, search_places
from .models import Search


EVALUATION_QUERIES = [
    {
        "query": "I need somewhere peaceful to clear my head",
        "relevant_tags": {"Quiet moments", "Woodland", "Forest", "Shade"},
    },
    {
        "query": "A quiet walk underneath tall trees",
        "relevant_tags": {"Trees", "Woodland", "Forest", "Shade"},
    },
    {
        "query": "Somewhere by the water to watch the sunset",
        "relevant_tags": {"Sunset", "Lake views", "Waterfront", "Beach"},
    },
    {
        "query": "A place to spot birds and explore wetlands",
        "relevant_tags": {"Birdwatching", "Wetlands", "Ponds"},
    },
]

STOP_WORDS = {
    "a",
    "and",
    "by",
    "i",
    "my",
    "somewhere",
    "the",
    "to",
}


def tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.casefold())
        if token not in STOP_WORDS
    }


def keyword_score(query: str, place: dict) -> float:
    """Fraction of distinct query tokens present in the catalogue text."""
    query_tokens = tokens(query)
    document = " ".join(
        [place["name"], place["description"], " ".join(place["tags"])]
    )
    document_tokens = tokens(document)
    if not query_tokens:
        return 0.0
    return len(query_tokens & document_tokens) / len(query_tokens)


def evaluate_retrieval(pool, encoder) -> dict:
    with pool.connection() as conn:
        catalogue = conn.execute(
            f"SELECT {PUBLIC_COLUMNS} FROM outdoor_places ORDER BY id"
        ).fetchall()

    cases = []
    for specification in EVALUATION_QUERIES:
        query = specification["query"]
        relevant_tags = specification["relevant_tags"]
        semantic = search_places(
            pool,
            Search(query=query, limit=len(catalogue)),
            encoder.encode(query),
        )
        keyword = sorted(
            (
                {**place, "keyword_score": keyword_score(query, place)}
                for place in catalogue
            ),
            key=lambda place: (-place["keyword_score"], place["id"]),
        )

        def is_relevant(place):
            return bool(relevant_tags.intersection(place["tags"]))

        def reciprocal_rank(rows):
            for index, row in enumerate(rows, start=1):
                if is_relevant(row):
                    return 1 / index
            return 0.0

        def top(rows, score_key):
            return [
                {
                    "name": row["name"],
                    "score": round(float(row[score_key]), 4),
                    "relevant": is_relevant(row),
                    "tags": row["tags"],
                }
                for row in rows[:5]
            ]

        cases.append(
            {
                "query": query,
                "relevance_rule": "At least one authored relevant tag matches.",
                "relevant_tags": sorted(relevant_tags),
                "semantic": {
                    "top_5": top(semantic, "similarity"),
                    "relevant_at_3": sum(is_relevant(row) for row in semantic[:3]),
                    "relevant_at_5": sum(is_relevant(row) for row in semantic[:5]),
                    "reciprocal_rank": round(reciprocal_rank(semantic), 4),
                },
                "keyword": {
                    "top_5": top(keyword, "keyword_score"),
                    "relevant_at_3": sum(is_relevant(row) for row in keyword[:3]),
                    "relevant_at_5": sum(is_relevant(row) for row in keyword[:5]),
                    "reciprocal_rank": round(reciprocal_rank(keyword), 4),
                },
            }
        )

    return {
        "method": {
            "semantic": "Normalized MiniLM embeddings ranked by exact pgvector cosine similarity.",
            "keyword": "Distinct non-stopword query-token overlap with name, description and tags; ties use catalogue ID.",
            "relevance": "A transparent, task-specific tag rule authored before inspecting rankings.",
            "limitations": "Four queries over 24 authored places are demonstration evidence, not a general benchmark.",
        },
        "queries": cases,
        "summary": {
            "semantic_mean_relevant_at_3": round(
                mean(case["semantic"]["relevant_at_3"] for case in cases), 3
            ),
            "keyword_mean_relevant_at_3": round(
                mean(case["keyword"]["relevant_at_3"] for case in cases), 3
            ),
            "semantic_mean_relevant_at_5": round(
                mean(case["semantic"]["relevant_at_5"] for case in cases), 3
            ),
            "keyword_mean_relevant_at_5": round(
                mean(case["keyword"]["relevant_at_5"] for case in cases), 3
            ),
            "semantic_mean_reciprocal_rank": round(
                mean(case["semantic"]["reciprocal_rank"] for case in cases), 3
            ),
            "keyword_mean_reciprocal_rank": round(
                mean(case["keyword"]["reciprocal_rank"] for case in cases), 3
            ),
        },
    }
