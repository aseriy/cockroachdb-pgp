UI_SOURCES := $(wildcard ui/src/*) ui/index.html ui/vite.config.ts ui/package.json
UI_BUNDLE  := build/ui/index.html

DEPLOYABLE := crs/pgp.yaml

MANIFESTS := build/manifests/schema.json \
             build/manifests/function.json \
             build/manifests/deployment.json

IMG ?= cockroachdb-pgp-demo:latest

.PHONY: all crs image clean

all: crs image

crs: $(DEPLOYABLE)

$(UI_BUNDLE): $(UI_SOURCES)
	npm --prefix ui install
	npm --prefix ui run build

build/manifests/schema.json: db/schema.sql manifests/schema.json Makefile
	mkdir -p $(dir $@)
	jq --rawfile sql $< '.spec.migrations[0].sql = $$sql' manifests/schema.json > $@

build/manifests/function.json: functions/cockroachdb-pgp-demo/index.ts manifests/function.json Makefile
	mkdir -p $(dir $@)
	jq --rawfile src $< '.spec.source["index.ts"] = $$src' manifests/function.json > $@

build/manifests/deployment.json: manifests/deployment.json Makefile
	mkdir -p $(dir $@)
	cp $< $@

image: $(UI_BUNDLE)
	docker build -t $(IMG) .

$(DEPLOYABLE): $(MANIFESTS)
	mkdir -p crs
	{ cat build/manifests/schema.json; \
	  printf -- '---\n'; cat build/manifests/function.json; \
	  printf -- '---\n'; cat build/manifests/deployment.json; } > $@

clean:
	rm -rf build crs ui/node_modules
