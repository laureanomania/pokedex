document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const pokemonList = document.getElementById("pokemonList");
  const typeNav = document.getElementById("typeNav");
  const submitTeamButton = document.getElementById("submitTeam");
  const apiBaseUrl = "https://pokeapi.co/api/v2/pokemon";
  const maxSelected = 6;
  let selectedPokemons = [];
  let allPokemonData = [];
  let allPokemonTypes = new Set();
  let currentFilterType = null; // Para guardar el tipo actual de filtro

  function loadSelectedPokemons() {
    selectedPokemons =
      JSON.parse(localStorage.getItem("selectedPokemons")) || [];
    fetchPokemonList();
  }

  function fetchPokemonList() {
    fetch(`${apiBaseUrl}?limit=150`)
      .then((response) => response.json())
      .then((data) => {
        allPokemonData = [];
        allPokemonTypes = new Set();
        const fetchPromises = data.results.map((pokemon) =>
          fetchPokemonDetails(pokemon.url)
        );
        return Promise.all(fetchPromises);
      })
      .catch((error) => console.error("Error fetching Pokémon list:", error));
  }

  function fetchPokemonDetails(url) {
    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        allPokemonData.push(data);
        data.types.forEach((typeInfo) =>
          allPokemonTypes.add(typeInfo.type.name)
        );
        updateTypeNav();
        filterAndDisplayPokemons(); // Filtra y muestra Pokémon después de obtener todos los datos
      })
      .catch((error) =>
        console.error("Error fetching Pokémon details:", error)
      );
  }

  function filterAndDisplayPokemons() {
    pokemonList.innerHTML = "";

    // Filtrar Pokémon según el tipo actual de filtro
    const pokemonsToDisplay = allPokemonData
      .filter((pokemon) => {
        if (currentFilterType) {
          return pokemon.types.some(
            (typeInfo) => typeInfo.type.name === currentFilterType
          );
        }
        return true; // Si no hay filtro, mostrar todos los Pokémon
      })
      .filter((pokemon) => !selectedPokemons.some((p) => p.id === pokemon.id))
      .sort((a, b) => a.id - b.id);

    pokemonsToDisplay.forEach((pokemon) => {
      displayPokemon(pokemon);
    });
  }

  function displayPokemon(pokemon) {
    const pokemonCard = document.createElement("div");
    pokemonCard.className = "pokemon-card";
    pokemonCard.dataset.id = pokemon.id;
    pokemonCard.dataset.types = pokemon.types
      .map((typeInfo) => typeInfo.type.name)
      .join(" ");

    const pokemonImage = document.createElement("img");
    pokemonImage.src = pokemon.sprites.front_default;
    pokemonImage.alt = pokemon.name;
    pokemonImage.className = "pokemon-image";

    const pokemonName = document.createElement("h3");
    pokemonName.textContent =
      pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    pokemonCard.appendChild(pokemonImage);
    pokemonCard.appendChild(pokemonName);

    pokemonCard.addEventListener("click", () => handlePokemonClick(pokemon));

    pokemonList.appendChild(pokemonCard);
  }

  function handlePokemonClick(pokemon) {
    const pokemonCard = document.querySelector(
      `.pokemon-card[data-id="${pokemon.id}"]`
    );
    const isSelected = pokemonCard.classList.contains("selected");

    if (isSelected) {
      pokemonCard.classList.remove("selected");
      selectedPokemons = selectedPokemons.filter((p) => p.id !== pokemon.id);
    } else {
      if (selectedPokemons.length < maxSelected) {
        pokemonCard.classList.add("selected");
        selectedPokemons.push(pokemon);
      } else {
        Swal.fire({
          icon: "error",
          title: "No puedes elegir más de 6 Pokémon",
          text: "Recuerda que si eliges más de 6 se enviarán al profesor.",
        });
        return;
      }
    }

    saveSelectedPokemons();

    if (selectedPokemons.length === maxSelected) {
      Swal.fire({
        title: "¡Felicidades!",
        text: "¡Ya tienes tu equipo confirmado! Dirígete al botón Equipo en la parte inferior.",
        icon: "success",
        confirmButtonText: "Genial",
      });
    }

    filterAndDisplayPokemons(); // Refresca la lista después de seleccionar o deseleccionar un Pokémon
  }

  function saveSelectedPokemons() {
    localStorage.setItem("selectedPokemons", JSON.stringify(selectedPokemons));
  }

  function updateTypeNav() {
    typeNav.innerHTML = "";

    allPokemonTypes.forEach((type) => {
      const typeButton = document.createElement("button");
      typeButton.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      typeButton.addEventListener("click", () => {
        currentFilterType = type;
        filterAndDisplayPokemons(); // Aplica el filtro de tipo y muestra los resultados
      });
      typeNav.appendChild(typeButton);
    });

    const allButton = document.createElement("button");
    allButton.textContent = "Todos";
    allButton.addEventListener("click", () => {
      currentFilterType = null; // Elimina el filtro de tipo
      filterAndDisplayPokemons(); // Muestra todos los Pokémon
    });
    typeNav.appendChild(allButton);
  }

  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    const queryNumber = parseInt(query, 10);

    if (query) {
      const filteredPokemon = allPokemonData
        .filter((pokemon) => {
          const name = pokemon.name.toLowerCase();
          const id = pokemon.id.toString();
          return name.includes(query) || id.includes(queryNumber);
        })
        .sort((a, b) => a.id - b.id);

      pokemonList.innerHTML = "";
      filteredPokemon.forEach((pokemon) => {
        if (!selectedPokemons.some((p) => p.id === pokemon.id)) {
          displayPokemon(pokemon);
        }
      });
    } else {
      filterAndDisplayPokemons(); // Refresca la lista de Pokémon al quitar la búsqueda
    }
  });

  submitTeamButton.addEventListener("click", () => {
    if (selectedPokemons.length > 0) {
      const queryString = selectedPokemons
        .map((pokemon) => `pokemons[]=${encodeURIComponent(pokemon.id)}`)
        .join("&");
      window.location.href = `team.html?${queryString}`;
    } else {
      Swal.fire({
        icon: "warning",
        title: "No has seleccionado ningún Pokémon",
        text: "Selecciona al menos un Pokémon para enviar tu equipo.",
      });
    }
  });

  loadSelectedPokemons();
});
