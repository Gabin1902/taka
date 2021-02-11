Fonctionnalités
===============

-----

Lecteur carte à puce
--------------------

La lecture de la carte d'identité se fait par contact (insertion de la carte
verticalement dans le boitier Taka).

Spécifications du lecteur:

* **Type de lecture:** Contact
* **Standard de la carte:** ISO/IEC 7816
* **Authentification passive:** ICAO 9303 Part 11 PKCS#7 ECDSA

* **Applications supportées:**

    * **ICAO:** (eTravel Doc 9303)
    * **ARCH:** (Assurance pour le Renforcement du Capital Humain)
    * **MoC (Match-on-card):** ISO 19794-2 NIST MINEX

-----

Capteur d'empreinte digitale
----------------------------

La lecture de l'empreinte digitale du bénéficiaire se fait par un capteur
optique situé à l'avant du boitier Taka et sur lequel la personne place
son doigt.

Spécifications du capteur:

* **Type de caméra:** Optique
* **Zone de capture d’image:** 17x18 mm
* **Résolution:** 640x480 pixels @1000 dpi
* **Eclairage:** 1 LED Bleue + 2 LED Infrarouges

-----

Authentification
----------------

Les minutiaes sont extraits de l'image de l'empreinte digitale via une
librairie satisfaisant aux critères de performance et de qualité spécifiés par
MINEX, puis sont envoyés à la carte d'identité pour vérification.

* **Type d’authentification:** Match on Card
* **Standard de l’empreinte:** ISO/IEC 19794-2:2005

-----

Ecran LCD
---------

Le boitier Taka est pourvu d'un écran LCD rétroéclairé permettant d'afficher
des instructions pour l'utilisateur et de suivre les opérations en cours.

* **Affichage:** Ecran LCD 2x16 caractères
* **Rétroéclairage**

-----

Indicateurs
-----------

Le résultat de l'authentification (succès en cas de concordance des empreintes,
ou échec en cas de non concordance) est indiqué sur le boitier Taka
via un système lumineux et sonore.

* **Indicateur lumineux:** LED RGB (7 couleurs)
* **Indicateur sonore:** Buzzer

-----

Journaux
--------

Chaque opération d'authentification et son résultat sont enregistrés
dans un journal. Ce journal peut être lu via l'API USB (ou en retirant
la carte SD du boitier)

* **Stockage:** Carte micro SD (1 GB)
* **Système de fichier:** FAT32

-----

Batterie
--------

Le boitier Taka est autonome et peut fonctionner sur batterie.

* **Autonomie sur batterie:** 24h minimum
* **Chargement:** Via câble USB (5V)
* **Type de batterie:** Li-ion 1 cellule 3.7V 10000mAh

-----

USB
---

Le connecteur USB situé à l'arrière du boitier Taka permet une connexion
à un PC.

* **Connecteur:** USB2 type-B (Full-Speed)
* **API USB**

L'API USB permet d'accéder aux données suivantes:

* **Données ICAO** contenues sur la carte d'identité
* **Données ARCH**
* **Journaux:** logs des tentatives d’authentification et résultats
* **Image et minutiaes** de l'empreinte digitale en cours de traitement

-----

Réseau (Ethernet)
-----------------

* **Connecteur:** Ethernet RJ45 10/100 Mbits
* **API réseau:** Non implémentée
* **Serveur Telnet** (Debug ou développement)
