"""Database-layer constants.

EMBEDDING_DIMENSION is an *initial implementation choice* for the CDP-001
foundation, not a platform-wide model contract. It was picked as a small
dimension that is cheap to store and index in pgvector while the embedding
pipeline is still unimplemented.

Changing it later is a schema change: add a migration that alters the column
type and rebuild any vector indexes. Do not treat the current value as a
promise about the future embedding model.
"""

EMBEDDING_DIMENSION = 512
