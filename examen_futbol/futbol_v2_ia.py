# Mi equipo de fútbol 7 - versión 2 (mejorada con IA)  # [IA]

# Constantes  # [IA]
PRECIO_CANTERANO = 10  # [IA]
PRECIO_GALACTICO = 25  # [IA]
TAMANO_PLANTILLA = 10  # [IA]
PRESUPUESTO_INICIAL = 150


def pedir_cantidad():  # [IA] función nueva: evita que el programa se cierre si no se escribe un número
    texto = input("¿Cuántos? ").strip()  # [IA]
    if texto.lstrip("-").isdigit():  # [IA]
        return int(texto)  # [IA]
    return 0  # [IA] un texto no numérico se trata como cantidad no válida


def calcular_rango(canteranos, galacticos):  # [IA] el rango pasa a una función
    if canteranos >= 5 and galacticos >= 2:  # [IA]
        return "🏆 Rango: Candidato al título"  # [IA]
    elif canteranos >= 5:  # [IA]
        return "🌱 Rango: Equipo de cantera"  # [IA]
    elif canteranos + galacticos == 0:  # [IA]
        return "🪑 Rango: Sin plantilla"  # [IA]
    else:  # [IA]
        return "⚽ Rango: Equipo en construcción"  # [IA]


# Variables del mercado  # [IA]
presupuesto = PRESUPUESTO_INICIAL  # [IA]
gastado = 0  # [IA]
canteranos = 0  # [IA]
galacticos = 0  # [IA]
mercado_abierto = True  # [IA]

print("⚽  BIENVENIDO AL MERCADO DE FICHAJES  ⚽")  # [IA]

# Repetimos el menú hasta que se cierre el mercado  # [IA]
while mercado_abierto:  # [IA]
    ocupadas = canteranos + galacticos  # [IA]
    print()
    print(f"Presupuesto: {presupuesto} M€ · Plantilla: {ocupadas}/{TAMANO_PLANTILLA}")  # [IA]
    print("1. Fichar  2. Ver plantilla  3. Cerrar el mercado")  # [IA]
    opcion = input("¿Qué quieres hacer? ").strip()  # [IA] se quitan los espacios de la opción

    if opcion == "1":
        # Pedimos el tipo de jugador (sin espacios, en minúsculas y sin tilde)  # [IA]
        tipo = input("¿Qué jugador? (canterano/galáctico): ").strip().lower()  # [IA]
        tipo = tipo.replace("á", "a")  # [IA]
        cantidad = pedir_cantidad()  # [IA] se usa la función que valida el número

        # Calculamos el coste según el tipo  # [IA]
        if tipo == "canterano":  # [IA]
            coste = cantidad * PRECIO_CANTERANO  # [IA]
        elif tipo == "galactico":  # [IA]
            coste = cantidad * PRECIO_GALACTICO  # [IA]
        else:
            coste = 0  # [IA]

        fichas_libres = TAMANO_PLANTILLA - ocupadas  # [IA]

        # Comprobaciones en el orden de la tabla de errores  # [IA]
        if tipo != "canterano" and tipo != "galactico":  # [IA]
            print("✘ Ese jugador no está en el mercado")  # [IA]
        elif cantidad <= 0:  # [IA]
            print("✘ La cantidad debe ser mayor que 0")  # [IA]
        elif coste > presupuesto:  # [IA]
            print(f"✘ No tienes presupuesto suficiente: cuesta {coste} M€ y tienes {presupuesto} M€")  # [IA]
        elif cantidad > fichas_libres:  # [IA]
            print(f"✘ No caben en la plantilla: quedan {fichas_libres} fichas libres")  # [IA]
        else:
            presupuesto -= coste  # [IA] operador abreviado
            gastado += coste  # [IA] operador abreviado
            if tipo == "canterano":  # [IA]
                canteranos += cantidad  # [IA] operador abreviado
            else:
                galacticos += cantidad  # [IA] operador abreviado
            print(f"✔ Has fichado {cantidad} x {tipo} por {coste} M€")  # [IA]

    elif opcion == "2":
        # Ver plantilla  # [IA]
        print(f"🌱 Canteranos: {canteranos}")  # [IA]
        print(f"⭐ Galácticos: {galacticos}")  # [IA]
        print(f"Fichas libres: {TAMANO_PLANTILLA - ocupadas}")  # [IA]

    elif opcion == "3":
        mercado_abierto = False  # [IA]

    else:
        print("✘ Opción no válida")

# Resumen al cerrar el mercado  # [IA]
print()
print("═════════ MERCADO CERRADO ═════════")  # [IA]
print(f"Gastado en fichajes: {gastado} M€")  # [IA]
print(f"Presupuesto final: {presupuesto} M€")  # [IA]
print(f"Plantilla: {canteranos} canteranos y {galacticos} galácticos")  # [IA]
print(calcular_rango(canteranos, galacticos))  # [IA] el rango se obtiene con la función
