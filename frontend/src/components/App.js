import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import EditAvatarPopup from "./EditAvatarPopup";
import EditProfilePopup from "./EditProfilePopup";
import AddPlacePopup from "./AddPlacePopup.js";
import Register from "./Register";
import Login from "./Login";
import ProtectedRoute from "./ProtectedRoute";
import InfoTooltip from "./InfoTooltip";
import ImagePopup from "./ImagePopup.js";
import React, { useState, useCallback, useEffect } from "react";
import "../index.css";
import Header from "./Header.js";
import Main from "./Main.js";
import Footer from "./Footer.js";
import { CurrentUserContext } from "../Contexts/CurrentUserContext";
import api from "../utils/Api";
import * as auth from "../utils/auth";

export default function App() {
  const navigate = useNavigate();

  // STATES
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [isEditAvatarPopupOpen, setEditAvatarPopup] = useState(false);
  const [isEditProfilePopupOpen, setEditProfilePopup] = useState(false);
  const [isAddPlacePopupOpen, setAddPlacePopup] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const [isRegistrationStatus, setisRegistrationStatus] = useState(false);
  const [email, setEmail] = useState("");

  // EFFECTS
console.log(isLoggedIn);
  useEffect(() => {
    if (isLoggedIn) {
      const loadDefaultData = async () => {
        try {
          const [userInfo, defaultCards] = await api.loadDefaultData();
          console.log(userInfo,"USERINFO");
          console.log(defaultCards,"defaultCards")
          setCurrentUser({ ...userInfo });
          setCards([...defaultCards]);
        } catch (err) {
          console.log(err, "Ошибка загрузки начальных данных.");
        }
      };
      loadDefaultData();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleCardDelete = (cardID) => {
    console.log(cardID);
    api
      .deleteCard(cardID)
      .then(() => {
        setCards((cards) => cards.filter((card) => card._id !== cardID));
      })
      .catch((err) => {
        console.log(`Ошибка: ${err}`);
      });
  };
// Лайк
  const handleCardLike = (card) => {
    console.log(card,"card");
  console.log(currentUser._id,"currentUser._id");
    const isLiked = card.likes.some((i) => i === currentUser._id);
    const jwt = localStorage.getItem('jwt');
    api
      .toggleLike(card._id, !isLiked, jwt)
      .then((newCard) => {
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c))
        );
      })
      .catch((err) => {
        console.log(`Ошибка: ${err}`);
      });
  };

  const handleUpdateUser = (UserData) => {
    api
      .editUserData(UserData)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(`Ошибка: ${err}`);
      });
  };

  const handleUpdateAvatar = (newURL) => {
    const jwt = localStorage.getItem("jwt");
    api
      .setUserAvatar(newURL, jwt)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(`Ошибка: ${err}`);
      });
  };

  const handleAddPlaceSubmit = (card) => {
    api
      .addCard(card)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(`Ошибка: ${err}`);
      });
  };

  const handleEditAvatarClick = useCallback(() => setEditAvatarPopup(true), []);

  const handleEditProfileClick = useCallback(
    () => setEditProfilePopup(true),
    []
  );

  const handleAddPlaceClick = useCallback(() => setAddPlacePopup(true), []);

  const handleCardClick = useCallback((card) => setSelectedCard(card), []);

  // Функция закрытия всех попапов

  const closeAllPopups = () => {
    setAddPlacePopup(false);
    setEditAvatarPopup(false);
    setEditProfilePopup(false);
    setSelectedCard({});
    setIsInfoTooltipOpen(false);
  };

  //________REGISTER______//

  const handleRegistration = (data) => {
    console.log(data);
    return auth
      .register(data)
      .then(() => {
        setisRegistrationStatus(true);
        setIsInfoTooltipOpen(true);
        navigate("/sign-in");
      })
      .catch((err) => {
        console.log(err);
        setIsInfoTooltipOpen(true);
        setisRegistrationStatus(false);
      });
  };

  //______LOGIN_______//

  const handleAuthorization = useCallback(async (data) => {
    try {
      const res = await auth.authorize(data);
      if (res) {
        localStorage.setItem("jwt", res.token);
        await checkToken();
        setIsLoggedIn(true);
        navigate("/");
      }
    } catch (err) {
      console.log("падаем");
      console.log(err);
      setisRegistrationStatus(false);
      setIsInfoTooltipOpen(true);
    }
  });

  //______CHECK TOKEN_______//

  const checkToken = useCallback(async () => {
    const jwt = localStorage.getItem("jwt");
    console.log(jwt,"это мой токен");
    try {
      const user = await auth.getContent(jwt);
console.log(user,"ЮЗЕР");
      // setEmail(user.data.email);
      setCurrentUser(user.email);
      setIsLoggedIn(true);
    } catch (err) {
      console.log(err, "Ошибка проверки токена");
    }
  }, []);

  //______SIGN OUT_______/

  const handleSignOut = () => {
    localStorage.removeItem("jwt");
    navigate("/sign-in");
    setIsLoggedIn(false);
    setCurrentUser({});
    setEmail("");
  };

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="root">
        <div className="page">
          <Header
            // status={isRegistrationStatus}
            loggedIn={isLoggedIn}
            userEmail={email}
            onSignOut={handleSignOut}
            // currentUser={currentUser}
          />

          <Routes>
            <Route
              path="/sign-up"
              element={<Register onSubmit={handleRegistration} />}
            />

            <Route
              path="/sign-in"
              element={<Login onSubmit={handleAuthorization} />}
            />

            <Route
              path="/"
              element={
                <ProtectedRoute
                  component={Main}
                  loggedIn={isLoggedIn}
                  cards={cards}
                  onEditAvatar={handleEditAvatarClick}
                  onEditProfile={handleEditProfileClick}
                  onAddPlace={handleAddPlaceClick}
                  onCardClick={handleCardClick}
                  onCardDelete={handleCardDelete}
                  onCardLike={handleCardLike}
                />
              }
            />
            <Route
              path="*"
              element={
                isLoggedIn ? <Navigate to="/" /> : <Navigate to="/sign-up" />
              }
            />
          </Routes>

          <Footer />
        </div>
        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
        />
        <InfoTooltip
          onClose={closeAllPopups}
          isOpen={isInfoTooltipOpen}
          isSuccess={isRegistrationStatus}
        />
        <ImagePopup card={selectedCard} onClose={closeAllPopups} />
      </div>
    </CurrentUserContext.Provider>
  );
}
