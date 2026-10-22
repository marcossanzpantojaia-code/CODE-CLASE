# Mi equipo de fútbol 7 - versión 2 (mejorada con IA)

# Constantes
PRECIO_CANTERANO = 10
PRECIO_GALACTICO = 25
TAMANO_PLANTILLA = 10
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


# Variables del mercado
presupuesto = PRESUPUESTO_INICIAL
gastado = 0
canteranos = 0
galacticos = 0
mercado_abierto = True

print("⚽  BIENVENIDO AL MERCADO DE FICHAJES  ⚽")

# Repetimos el menú hasta que se cierre el mercado
while mercado_abierto:
    ocupadas = canteranos + galacticos
    print()
    print(f"Presupuesto: {presupuesto} M€ · Plantilla: {ocupadas}/{TAMANO_PLANTILLA}")
    print("1. Fichar  2. Ver plantilla  3. Cerrar el mercado")
    opcion = input("¿Qué quieres hacer? ").strip()  # [IA] se quitan los espacios de la opción

    if opcion == "1":
        # Pedimos el tipo de jugador (sin espacios, en minúsculas y sin tilde)
        tipo = input("¿Qué jugador? (canterano/galáctico): ").strip().lower()
        tipo = tipo.replace("á", "a")
        cantidad = pedir_cantidad()  # [IA] se usa la función que valida el número

        # Calculamos el coste según el tipo
        if tipo == "canterano":
            coste = cantidad * PRECIO_CANTERANO
        elif tipo == "galactico":
            coste = cantidad * PRECIO_GALACTICO
        else:
            coste = 0

        fichas_libres = TAMANO_PLANTILLA - ocupadas

        # Comprobaciones en el orden de la tabla de errores
        if tipo != "canterano" and tipo != "galactico":
            print("✘ Ese jugador no está en el mercado")
        elif cantidad <= 0:
            print("✘ La cantidad debe ser mayor que 0")
        elif coste > presupuesto:
            print(f"✘ No tienes presupuesto suficiente: cuesta {coste} M€ y tienes {presupuesto} M€")
        elif cantidad > fichas_libres:
            print(f"✘ No caben en la plantilla: quedan {fichas_libres} fichas libres")
        else:
            presupuesto -= coste  # [IA] operador abreviado
            gastado += coste  # [IA] operador abreviado
            if tipo == "canterano":
                canteranos += cantidad  # [IA] operador abreviado
            else:
                galacticos += cantidad  # [IA] operador abreviado
            print(f"✔ Has fichado {cantidad} x {tipo} por {coste} M€")

    elif opcion == "2":
        # Ver plantilla
        print(f"🌱 Canteranos: {canteranos}")
        print(f"⭐ Galácticos: {galacticos}")
        print(f"Fichas libres: {TAMANO_PLANTILLA - ocupadas}")

    elif opcion == "3":
        mercado_abierto = False

    else:
        print("✘ Opción no válida")

# Resumen al cerrar el mercado
print()
print("═════════ MERCADO CERRADO ═════════")
print(f"Gastado en fichajes: {gastado} M€")
print(f"Presupuesto final: {presupuesto} M€")
print(f"Plantilla: {canteranos} canteranos y {galacticos} galácticos")
print(calcular_rango(canteranos, galacticos))  # [IA] el rango se obtiene con la función
