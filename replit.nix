{ pkgs }:
let
  dependencies = with pkgs; [
    nodejs          # Если вы используете Node.js, оставьте эту строку
    openssh         # Добавляем пакет openssh
  ];
in pkgs.mkShell {
  buildInputs = dependencies;
}