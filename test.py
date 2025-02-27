#!/usr/bin/env python3

def print_color_block(ansi_color, description):
    # On affiche une ligne remplie de blocs colorés suivi de la description de la couleur.
    block = "█" * 30
    print(f"{ansi_color}{block} {description}\033[0m")

if __name__ == '__main__':
    variants = [
        ("\033[38;2;117;215;255m", "Variante 1 : RGB (50, 140, 255)"),

    ]
    
    for ansi_color, description in variants:
        print_color_block(ansi_color, description)
