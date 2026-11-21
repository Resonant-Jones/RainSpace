# Backend container for the Creator Distribution Platform API.
#
# The image runs the public read-only catalog API only. It contains no media
# files, no credentials and no payment integration.
#
# Dependencies are installed from the pinned [project] table in
# pyproject.toml - that file is the single source of truth for versions. The
# "dev" extra carries the test tooling, so `pytest` runs inside the image.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app \
    ALEMBIC_CONFIG=/app/alembic/alembic.ini

WORKDIR /app

# The application source and its manifest, then the dependencies. Installing
# the project makes the pinned dependency set resolvable in one step.
COPY pyproject.toml ./
COPY app ./app
RUN pip install --no-cache-dir ".[dev]"

COPY alembic ./alembic
COPY tests ./tests

# Run as a non-root user.
RUN useradd --create-home --uid 10001 apiuser && chown -R apiuser:apiuser /app
USER apiuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
