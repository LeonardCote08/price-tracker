#!/usr/bin/env python
"""
Script to display ANSI colors in Windows Terminal.
Run with: python ansi_colors.py
"""

RESET = "\033[0m"
BOLD = "\033[1m"
YELLOW = "\033[93m"
CYAN = "\033[96m"

# Standard foreground colors
colors = {
    "Black": "\033[30m",
    "Red": "\033[31m",
    "Green": "\033[32m",
    "Yellow": "\033[33m",
    "Blue": "\033[34m",
    "Magenta": "\033[35m",
    "Cyan": "\033[36m",
    "White": "\033[37m",
}

# Bright foreground colors
bright_colors = {
    "Bright Black": "\033[90m",
    "Bright Red": "\033[91m",
    "Bright Green": "\033[92m",
    "Bright Yellow": "\033[93m",
    "Bright Blue": "\033[94m",
    "Bright Magenta": "\033[95m",
    "Bright Cyan": "\033[96m",
    "Bright White": "\033[97m",
}

# Standard background colors
bg_colors = {
    "BG Black": "\033[40m",
    "BG Red": "\033[41m",
    "BG Green": "\033[42m",
    "BG Yellow": "\033[43m",
    "BG Blue": "\033[44m",
    "BG Magenta": "\033[45m",
    "BG Cyan": "\033[46m",
    "BG White": "\033[47m",
}

# Bright background colors
bg_bright_colors = {
    "BG Bright Black": "\033[100m",
    "BG Bright Red": "\033[101m",
    "BG Bright Green": "\033[102m",
    "BG Bright Yellow": "\033[103m",
    "BG Bright Blue": "\033[104m",
    "BG Bright Magenta": "\033[105m",
    "BG Bright Cyan": "\033[106m",
    "BG Bright White": "\033[107m",
}

def print_title(title):
    print(f"{BOLD}{YELLOW}{title}{RESET}")

def main():
    # Affichage des couleurs standards (foreground)
    print_title("Standard Foreground Colors:")
    for name, code in colors.items():
        print(f"{code}{name}{RESET}", end="  ")
    print("\n")

    # Affichage des couleurs brillantes (foreground)
    print_title("Bright Foreground Colors:")
    for name, code in bright_colors.items():
        print(f"{code}{name}{RESET}", end="  ")
    print("\n")

    # Affichage des couleurs standards pour le fond
    print_title("Standard Background Colors:")
    for name, code in bg_colors.items():
        # Utilisation d'une couleur de texte contrastante (blanc)
        print(f"{code}{BOLD} {name} {RESET}", end="  ")
    print("\n")

    # Affichage des couleurs brillantes pour le fond
    print_title("Bright Background Colors:")
    for name, code in bg_bright_colors.items():
        print(f"{code}{BOLD} {name} {RESET}", end="  ")
    print("\n")

    # Affichage des 256 couleurs (foreground)
    print_title("256 Colors (Foreground):")
    for i in range(256):
        print(f"\033[38;5;{i}m{i:3}{RESET} ", end="")
        if (i + 1) % 16 == 0:
            print()
    print("\n")

    # Affichage des 256 couleurs (background)
    print_title("256 Colors (Background):")
    for i in range(256):
        print(f"\033[48;5;{i}m{i:3}{RESET} ", end="")
        if (i + 1) % 16 == 0:
            print()
    print("\n")

    # Affichage d'un gradient True Color (foreground)
    print_title("True Color Gradient (Foreground):")
    for i in range(0, 256, 10):
        # Créer un gradient de bleu vers rouge
        print(f"\033[38;2;{i};128;{255-i}m{i:3}{RESET} ", end="")
    print("\n")

if __name__ == "__main__":
    main()
