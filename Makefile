DEPLOYABLE := crs/pgp.yaml

MANIFESTS := build/manifests/schema.json \
             build/manifests/function.json

.PHONY: all crs clean

all: crs

crs: $(DEPLOYABLE)

build/manifests/schema.json: db/schema.sql manifests/schema.json Makefile
	mkdir -p $(dir $@)
	jq --rawfile sql $< '.spec.migrations[0].sql = $$sql' manifests/schema.json > $@

build/manifests/function.json: functions/cockroachdb-pgp-demo/index.ts manifests/function.json Makefile
	mkdir -p $(dir $@)
	jq --rawfile src $< '.spec.source["index.ts"] = $$src' manifests/function.json > $@

$(DEPLOYABLE): $(MANIFESTS)
	mkdir -p crs
	{ cat build/manifests/schema.json; \
	  printf -- '---\n'; cat build/manifests/function.json; } > $@

clean:
	rm -rf build crs
