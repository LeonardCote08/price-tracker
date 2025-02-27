#!/usr/bin/env python3

def print_color_block(ansi_color, description):
    # On affiche une ligne remplie de blocs colorés suivi de la description de la couleur.
    block = "█" * 30
    print(f"{ansi_color}{block} {description}\033[0m")

if __name__ == '__main__':
    variants = [
        ("\033[38;2;50;140;255m", "Variante 1 : RGB (50, 140, 255)"),
        ("\033[38;2;40;160;255m", "Variante 2 : RGB (40, 160, 255)"),
        ("\033[38;2;60;150;255m", "Variante 3 : RGB (60, 150, 255)"),
        ("\033[38;2;30;150;255m", "Variante 4 : RGB (30, 150, 255)")
    ]
    
    for ansi_color, description in variants:
        print_color_block(ansi_color, description)
