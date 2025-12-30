{
  description = "paperless-cli";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    bun2nix = {
      url = "github:nix-community/bun2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    bun2nix,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      bun2nix' = bun2nix.packages.${system}.default;
    in {
      formatter = pkgs.alejandra;

      packages.default = pkgs.stdenv.mkDerivation {
        pname = "paperless-cli";
        version = "0.1.0";
        src = ./.;

        nativeBuildInputs = [
          bun2nix'.hook
          pkgs.makeBinaryWrapper
        ];

        bunDeps = bun2nix'.fetchBunDeps {
          bunNix = ./bun.nix;
        };

        # Run with bun interpreter (not AOT compiled)
        dontUseBunBuild = true;
        dontUseBunCheck = true;
        dontUseBunInstall = true;

        installPhase = ''
          runHook preInstall

          mkdir -p $out/lib/paperless-cli
          cp -r . $out/lib/paperless-cli

          mkdir -p $out/bin
          makeBinaryWrapper ${pkgs.bun}/bin/bun $out/bin/paperless-cli \
            --add-flags "run $out/lib/paperless-cli/src/main.ts"

          runHook postInstall
        '';
      };

      devShells.default = pkgs.mkShell {
        packages = with pkgs; [
          bun
          typescript
          lefthook
          bun2nix'
        ];

        shellHook = ''
          echo "paperless-cli dev shell"
          echo "  bun2nix - Regenerate bun.nix after lockfile changes"
        '';
      };
    });
}
