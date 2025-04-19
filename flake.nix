{
  description = "Lepo Flakes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        defaultPackage = pkgs.stdenv.mkDerivation {
          pname    = "lepo";
          version  = "0.1.0";
          src      = ./.;

          # Runtime deps
          buildInputs = [
            pkgs.fd
            pkgs.ripgrep
            pkgs.perl
            pkgs.jq
            pkgs.git
            pkgs.openssh
            pkgs.curl
            pkgs.elinks
          ];

          # Build-time deps
          nativeBuildInputs = [
            pkgs.deno
            pkgs.fd
            pkgs.git
          ];

          buildPhase = "DENO_DIR=$TMPDIR deno task build";
          installPhase = "mkdir -p $out/bin && cp lepo $out/bin/lepo";
        };
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.deno
            pkgs.fd
            pkgs.ripgrep
            pkgs.perl
            pkgs.jq
            pkgs.git
            pkgs.openssh
            pkgs.curl
            pkgs.elinks
          ];
        };
      });
}
