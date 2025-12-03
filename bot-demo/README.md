# Velmu Bot Demo (Python)

Ce dossier contient un exemple simple de bot pour Velmu écrit en Python.
Il se connecte au serveur via Socket.IO pour recevoir les messages en temps réel et utilise l'API REST pour répondre.

## Prérequis

- Python 3.x installé
- Un compte Velmu et un Bot créé (avec son Token)

## Installation

1. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

1. Ouvrez le fichier `bot.py`.
2. Remplacez `VOTRE_TOKEN_ICI` par le token de votre bot (disponible dans Velmu > Paramètres > Développeur).
3. Vérifiez que `API_URL` et `SOCKET_URL` correspondent bien à l'adresse de votre serveur backend (par défaut `http://localhost:4000`).

## Lancement

```bash
python bot.py
```

## Fonctionnalités

- Le bot écoute les messages.
- Si un utilisateur envoie `!ping`, le bot répond `Pong ! 🏓`.
