#!/usr/bin/env python3

def print_color_block(ansi_code, description):
    # On affiche un bloc de texte coloré suivi de sa description.
    block = " " * 40
    print(f"{ansi_code}{block}\033[0m  {description}")

if __name__ == '__main__':
    variants = [
        ("\033[38;2;119;82;255m", "Original : RGB (119, 82, 255)"),
        ("\033[38;2;115;90;255m", "Variante 1 : RGB (115, 90, 255)"),
        ("\033[38;2;110;95;255m", "Variante 2 : RGB (110, 95, 255)"),
        ("\033[38;2;105;100;255m", "Variante 3 : RGB (105, 100, 255)")
    ]
    
    for ansi_color, description in variants:
        print_color_block(ansi_color, description)
