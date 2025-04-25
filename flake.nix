{
  description = "Lepo Flakes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      packages.default = pkgs.stdenv.mkDerivation {
        # Set sandbox = relaxed in ~/.config/nix/nix.conf on Linux
        __noChroot = true;
        pname = "lepo";
        version = "0.0.0";
        src = ./.;
        nativeBuildInputs = [ pkgs.makeWrapper pkgs.deno pkgs.fd pkgs.git ];
        buildPhase = ''
          export DENO_DIR=$TMPDIR/.deno
          deno task test --frozen && deno task compile --frozen
        '';
        installPhase = ''
          mkdir -p $out/bin
          cp lepo $out/bin/lepo
          wrapProgram $out/bin/lepo \
            --prefix-each PATH : "${pkgs.lib.makeBinPath [
              pkgs.fd  pkgs.ripgrep pkgs.perl pkgs.jq
              pkgs.git pkgs.openssh pkgs.curl pkgs.elinks
            ]}"
        '';
        dontStrip = true;
      };
      devShells.default = pkgs.mkShell {
        buildInputs = [
          pkgs.deno pkgs.fd      pkgs.ripgrep pkgs.perl   pkgs.jq
          pkgs.git  pkgs.openssh pkgs.curl    pkgs.elinks
        ];
      };
    });
}
