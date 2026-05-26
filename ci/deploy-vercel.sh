#!/usr/bin/env sh
set -eu


if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Missing required env var: VERCEL_TOKEN"
  exit 1
fi

if [ -z "${VERCEL_ORG_ID:-}" ]; then
  echo "Missing required env var: VERCEL_ORG_ID"
  exit 1
fi

if [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  echo "Missing required env var: VERCEL_PROJECT_ID"
  exit 1
fi


echo "Pulling Vercel project settings for production..."
pnpm dlx --allow-build=esbuild vercel@latest pull --yes --environment=production --token="$VERCEL_TOKEN"

echo "Building production artifacts..."
pnpm dlx --allow-build=esbuild vercel@latest build --prod --token="$VERCEL_TOKEN"

echo "Deploying production build..."
DEPLOYMENT_URL="$(pnpm dlx --allow-build=esbuild vercel@latest deploy --prebuilt --prod --token="$VERCEL_TOKEN")"

echo "Deployment URL: $DEPLOYMENT_URL"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "deployment-url=$DEPLOYMENT_URL" >> "$GITHUB_OUTPUT"
fi
