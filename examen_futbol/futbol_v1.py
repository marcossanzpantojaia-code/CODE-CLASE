# Mi equipo de fútbol 7 - versión 1

# Constantes
PRECIO_CANTERANO = 10
PRECIO_GALACTICO = 25
TAMANO_PLANTILLA = 10
PRESUPUESTO_INICIAL = 150

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
    opcion = input("¿Qué quieres hacer? ")

    if opcion == "1":
        # Pedimos el tipo de jugador (sin espacios, en minúsculas y sin tilde)
        tipo = input("¿Qué jugador? (canterano/galáctico): ").strip().lower()
        tipo = tipo.replace("á", "a")
        cantidad = int(input("¿Cuántos? "))

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
            presupuesto = presupuesto - coste
            gastado = gastado + coste
            if tipo == "canterano":
                canteranos = canteranos + cantidad
            else:
                galacticos = galacticos + cantidad
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

# Rango del equipo en el orden de la tabla
if canteranos >= 5 and galacticos >= 2:
    print("🏆 Rango: Candidato al título")
elif canteranos >= 5:
    print("🌱 Rango: Equipo de cantera")
elif canteranos + galacticos == 0:
    print("🪑 Rango: Sin plantilla")
else:
    print("⚽ Rango: Equipo en construcción")
