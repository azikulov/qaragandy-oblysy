import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { API_URL, endpoints } from "./config";
import { useTokenContext } from "./context/token";
import { useAuthContext } from "./context/auth";
import LogoPng from "./assets/logo.png";
import { Trans, useTranslation } from "react-i18next";

function LoginModal() {
  const { t } = useTranslation();

  const [localToken, setLocalToken] = useState({ access: null, refresh: null });
  const [filename, setFilename] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const [formData, setFormData] = useState({
    // phone: "",
    // password: "",
    phone: "+77770736981",
    password: "leopoldfitz",
  });

  // eslint-disable-next-line no-unused-vars
  const { _, updateToken } = useTokenContext();
  const { isAuth, updateAuth } = useAuthContext();

  async function getToken({ phone, password }) {
    if (localToken.access && localToken.refresh) {
      try {
        // Делаем запрос на валидный токен
        await axios.post(API_URL + endpoints.TOKEN_VERIFY, {
          token: localToken.access,
        });
      } catch (e) {
        // Вернет 401, если токен устарел
        if (e.response.status === 401) {
          // Делаем запрос чтобы обновить токен
          const newToken = await axios.post(API_URL + endpoints.TOKEN_REFRESH, {
            refresh: localToken.refresh,
          });

          setLocalToken(newToken.data);
          return newToken.data;
        }
      }

      return localToken;
    }

    const response = await axios.post(API_URL + endpoints.TOKEN, {
      phone,
      password,
    });

    setLocalToken(response.data);

    return response.data;
  }

  async function sendCertificate({ accessToken }) {
    const formData = new FormData();
    formData.append("journalist_certificate", filename);

    return await axios.patch(API_URL + endpoints.UPLOAD_CERTIFICATE, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError(false);

    try {
      const verifiedToken = await getToken({
        phone: formData.phone,
        password: formData.password,
      });

      // Сохраняем токен в глобальное состояние
      updateToken(verifiedToken);

      const response = await sendCertificate({
        accessToken: verifiedToken.access,
      });

      if (response.status === 200) {
        setIsLoading(false);
        return updateAuth(true);
      }
      setError(true);
      return updateAuth(false);
    } catch (e) {
      if (e.response.data.message === "Удостоверение уже имеется") {
        setIsLoading(false);
        return updateAuth(true);
      }

      setIsLoading(false);
      setError(true);
    }
  }

  return (
    <div
      className={`${
        isAuth ? "hidden" : "md:grid"
      } bg-[#00000080] z-50 w-screen fixed top-0 md:place-items-center md:py-10 overflow-y-auto`}
    >
      <div className="w-full md:max-w-lg bg-white">
        <img src={LogoPng} alt="qaragandy oblysy logo" className="w-full" />

        <div className="p-6">
          <h1 className="text-center font-bold text-2xl text-[#232323]">
            <Trans>Логин</Trans>
          </h1>

          <div className="flex flex-col gap-3 mt-4">
            <p className="text-[#232323]">
              <Trans>Номер телефона</Trans>
            </p>

            <input
              inputMode="tel"
              placeholder="+7 777 123 45 67"
              className="p-3 text-[#232323] border rounded-2xl border-[#9A9A9A]"
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, phone: event.target.value }));
                if (error) setError(false);
              }}
              value={formData.phone}
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <p className="text-[#232323]">
              <Trans>Пароль</Trans>
            </p>

            <input
              // type="password"
              type="text"
              placeholder="**********"
              className="p-3 text-[#232323] border rounded-2xl border-[#9A9A9A]"
              onChange={(event) => {
                setFormData((prev) => ({
                  ...prev,
                  password: event.target.value,
                }));
                if (error) setError(false);
              }}
              value={formData.password}
            />
          </div>

          <div className="flex flex-col items-start gap-3 mt-4">
            <p className="text-[#232323]">
              <Trans>Копия удостоверения журналиста</Trans>
            </p>

            <label
              htmlFor="file"
              className="transition duration-200 hover:bg-[#01abab] px-6 py-2.5 rounded-full cursor-pointer text-white bg-[#02C5C4]"
            >
              {filename ? filename.name : t("Загрузить файлы")}
            </label>

            <input
              id="file"
              onChange={(event) => setFilename(event.currentTarget.files[0])}
              hidden
              type="file"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`${isLoading ? "opacity-50" : ""} ${
              error ? "hover:bg-[#e11b32] bg-[#ef233c] stroke-error" : ""
            } transition duration-200 stroke hover:bg-[#01abab] py-3 w-full mt-4 rounded-full font-bold text-white bg-[#02C5C4]`}
          >
            <Trans>ВОЙТИ</Trans>
          </button>

          <p className="mt-4 text-sm text-center text-[#232323]">
            <Trans>
              Нажимая на кнопку, вы даете согласие на сбор и обработку ваших
              персональных данных
            </Trans>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();

  const { token } = useTokenContext();
  const { isAuth } = useAuthContext();

  const [candidates, setCadidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNominations, setSelectedNominations] = useState([]);

  const NOMINATIONS = {
    VER: "За верность профессии",
    ACT: "За активную жизненную позицию",
    OBJ: "Мастер объектива",
    RUR: "Лучшее освещение сельской тематики",
    SOC: "Лучшее освещение социальной тематики",
    IND: "Лучшее освещение производственной тематики",
    SUC: "За первые успехи",
    WOR: "Лучшая творческая работа года",
    STY: "За стиль и функциональность",
    NET: "За лучшее освещение актуальных проблем в социальных сетях",
  };

  const NOMINATIONS_LIST = [
    { name: "VER", nomination: "За верность профессии" },
    { name: "ACT", nomination: "За активную жизненную позицию" },
    { name: "OBJ", nomination: "Мастер объектива" },
    { name: "RUR", nomination: "Лучшее освещение сельской тематики" },
    { name: "SOC", nomination: "Лучшее освещение социальной тематики" },
    { name: "IND", nomination: "Лучшее освещение производственной тематики" },
    { name: "SUC", nomination: "За первые успехи" },
    { name: "WOR", nomination: "Лучшая творческая работа года" },
    { name: "STY", nomination: "За стиль и функциональность" },
    {
      name: "NET",
      nomination: "За лучшее освещение актуальных проблем в социальных сетях",
    },
  ];

  const getCandidates = useCallback(
    function () {
      axios
        .get(API_URL + endpoints.CANDIDATES, {
          headers: {
            Authorization: `Bearer ${token.access}`,
          },
        })
        .then((response) => {
          setCadidates(response.data);
        })
        .catch((error) => console.log(error))
        .finally(() => setIsLoading(false));
    },
    [token.access]
  );

  function handleVote(id, nomination) {
    return async (event) => {
      try {
        const response = await axios.post(
          API_URL + endpoints.VOTES,
          { candidate_id: id, nomination },
          {
            headers: {
              Authorization: `Bearer ${token.access}`,
            },
          }
        );

        if (response.data.message === "Голос успешно принят") {
          const vote =
            event.target.previousElementSibling.previousElementSibling
              .firstChild.nextElementSibling.nextElementSibling
              .nextElementSibling.firstChild.nextElementSibling.firstChild;
          vote.textContent = Number(vote.textContent) + 1;
        }
      } catch (e) {
        if (
          e.response.data.error === "Вы уже проголосовали в данной номинации"
        ) {
          alert("Вы уже проголосовали в данной номинации");
        }
      }
    };
  }

  function switchLanguage(language) {
    return () => {
      i18n.changeLanguage(language);
    };
  }

  useEffect(() => {
    if (isAuth) {
      getCandidates();
    }
  }, [getCandidates, isAuth]);

  return (
    <div>
      {/* <header className="sticky top-0 w-full bg-[#232323]">
        <div className="px-4 md:px-6 lg:max-w-7xl mx-auto lg:px-10 py-2 flex justify-between items-center">
          <LogoSVG className="w-16 h-16" />

          <div className="hidden md:flex gap-x-8">
            <ul className="flex items-center gap-x-16">
              <li>
                <a href="#" className="text-white text-xl font-medium">
                  Оставить заяву
                </a>
              </li>

              <li>
                <a href="#" className="text-white text-xl font-medium">
                  О премии
                </a>
              </li>

              <li>
                <a href="#" className="text-white text-xl font-medium">
                  Номинаций
                </a>
              </li>
            </ul>

            <ul className="flex items-center gap-x-3">
              <li>
                <a href="tel:+7 7212 504 509">
                  <svg
                    className="w-8 h-8"
                    width="30px"
                    height="30px"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM32.3668 30.3616C33.8958 28.835 34.6798 28.1875 35.1534 28.0601C35.715 27.909 36.2052 28.0405 36.7168 28.4797C37.1497 28.8512 38.2438 29.9713 38.9927 30.8096C41.1931 33.2729 43.8747 36.6359 44.2503 37.4031C44.3639 37.6353 44.375 37.701 44.3558 38.0323C44.3204 38.643 44.196 38.8343 43.3793 39.5344C42.0767 40.6509 40.0803 42.739 39.3824 43.7149C38.9257 44.3535 38.9126 44.7536 39.3248 45.483C39.675 46.1027 41.378 48.345 42.5783 49.7667C44.5875 52.1467 46.9159 54.3696 49.1773 56.0669C50.8579 57.3283 53.2214 58.7821 54.8035 59.5275C55.9343 60.0603 56.2878 60.0303 57.0122 59.3401C57.7069 58.6782 58.5246 57.6102 59.8946 55.5759C60.3408 54.9132 60.7739 54.3136 60.857 54.2434C61.1104 54.0293 61.3967 53.9282 61.8141 53.9055C62.0813 53.891 62.2608 53.9062 62.4057 53.9555C62.6843 54.0504 63.4107 54.5045 66.36 56.4276C67.7285 57.32 69.2454 58.3032 69.7309 58.6125C72.4818 60.3651 72.7871 60.6005 72.9291 61.0781C73.1185 61.7157 72.9605 62.1254 72.063 63.3233C70.9487 64.8107 69.0734 66.8197 67.674 68.0252C66.5388 69.0032 65.0797 69.9865 63.6409 70.743L63.0188 71.0701L62.389 71.0696C60.5532 71.0685 58.822 70.7024 56.1724 69.7552C49.967 67.5366 44.465 64.2895 39.647 60.0025C38.7431 59.1981 36.6429 57.0816 35.8606 56.1866C33.2537 53.2039 31.2905 50.2948 29.5948 46.9021C28.373 44.4575 27.2502 41.6203 27.0609 40.4995C26.7835 38.8572 27.4592 36.7086 28.9757 34.4108C29.8832 33.0359 30.8773 31.8488 32.3668 30.3616V30.3616Z"
                      fill="#01c5c4"
                    ></path>
                  </svg>
                </a>
              </li>

              <li>
                <a href="mailto:d.akisheva@karaganda-region.gov.kz?subject=Премия “Алтын Сұңқар”">
                  <svg
                    className="w-8 h-8"
                    width="30px"
                    height="30px"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M50 100c27.6142 0 50-22.3858 50-50S77.6142 0 50 0 0 22.3858 0 50s22.3858 50 50 50ZM26.2268 34.1813c.3042-.9738.9636-1.693 1.8568-2.0249l.4151-.1543 21.4794-.0018c21.3404-.0017 21.4819-.0009 21.8807.1335.9642.3248 1.6814 1.1482 1.9797 2.2727l.0944.3556-1.7711 1.2707c-2.462 1.7666-6.8447 4.9166-8.8523 6.3624-.925.6662-2.2783 1.639-3.0072 2.1619-2.1029 1.5081-4.2894 3.0785-5.891 4.2312-3.6493 2.6264-4.3577 3.1288-4.4113 3.1288-.0541 0-.817-.5414-4.5039-3.1961-1.6149-1.1627-3.4655-2.4914-5.7994-4.1637-.7296-.5227-2.1661-1.5561-3.1924-2.2964-1.0262-.7404-2.4421-1.7593-3.1465-2.2642-.7044-.5051-2.3496-1.6873-3.656-2.6273s-2.646-1.9002-2.9769-2.1338c-.667-.4708-.675-.4878-.4981-1.0543Zm-.1497 27.1823c-.0616.0397-.0771-2.244-.0771-11.3267 0-6.257.0122-11.3764.0271-11.3764.015 0 1.063.7458 2.3291 1.6574 2.2612 1.628 3.4539 2.4857 6.7132 4.8273 2.1704 1.5593 4.0585 2.9159 5.6761 4.0785.7296.5244 1.3265.9876 1.3265 1.0293 0 .0718-.8103.6465-3.9486 2.8008-.7465.5124-2.0931 1.4401-2.9923 2.0616-.8992.6215-3.1064 2.1429-4.9049 3.3809-1.7984 1.238-3.4504 2.3784-3.6709 2.5342-.2206.1559-.4357.3058-.4782.3331Zm43.234-19.3639c.6277-.4485 1.9187-1.381 2.8688-2.0722.9502-.6912 1.7483-1.259 1.7738-1.2619.0255-.0028.0463 5.1143.0463 11.3713 0 9.0827-.0155 11.3664-.0771 11.3267-.0424-.0273-.2576-.1768-.4782-.3323-.2205-.1554-1.0951-.7591-1.9434-1.3415-.8483-.5824-1.6812-1.1582-1.8509-1.2795-.1697-.1213-.7388-.5155-1.2648-.8759-.526-.3604-1.3172-.9043-1.7583-1.2086-.4412-.3043-2.1348-1.4711-3.7635-2.593-4.735-3.2613-4.9358-3.4028-4.9358-3.4788 0-.0759.2206-.2386 4.0412-2.9806 1.3064-.9376 3.2359-2.3243 4.2879-3.0815 1.0519-.7573 2.4262-1.7437 3.054-2.1922ZM37.8152 57.1366c.3609-.2411 1.7297-1.1886 4.8121-3.3308 1.2215-.849 2.2627-1.5349 2.3136-1.5242.0509.0107 1.0504.7092 2.2211 1.5523 1.1706.8431 2.2361 1.5743 2.3676 1.625.3044.1171.6365.117.9414-.0003.1318-.0507 1.1964-.7809 2.3658-1.6228 1.1693-.8418 2.1572-1.5435 2.1951-1.5594.0604-.0253 1.5111.9576 5.8267 3.9476 1.1431.7919 2.7209 1.8798 5.9537 4.1051.9502.6541 2.9214 2.014 4.3805 3.022l2.653 1.8328-.0051.2599c-.0072.3723-.3476 1.0784-.7463 1.5482-.3863.4549-1.0056.8296-1.5552.9408C71.322 67.9767 63.8578 68 50 68c-13.8578 0-21.322-.0233-21.5392-.0672-.5496-.1112-1.1689-.4859-1.5552-.9408-.3741-.4409-.7126-1.118-.7618-1.5243l-.0316-.2603 1.656-1.14c.9108-.627 2.2112-1.5239 2.8899-1.9932 3.6716-2.539 6.8851-4.7559 7.1571-4.9376Z"
                      fill="#01c5c4"
                    ></path>
                  </svg>
                </a>
              </li>

              <li>
                <a href="https://www.instagram.com/akimat__09/">
                  <svg
                    className="w-8 h-8"
                    width="30px"
                    height="30px"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM25 39.3918C25 31.4558 31.4566 25 39.3918 25H60.6082C68.5442 25 75 31.4566 75 39.3918V60.8028C75 68.738 68.5442 75.1946 60.6082 75.1946H39.3918C31.4558 75.1946 25 68.738 25 60.8028V39.3918ZM36.9883 50.0054C36.9883 42.8847 42.8438 37.0922 50.0397 37.0922C57.2356 37.0922 63.0911 42.8847 63.0911 50.0054C63.0911 57.1252 57.2356 62.9177 50.0397 62.9177C42.843 62.9177 36.9883 57.1252 36.9883 50.0054ZM41.7422 50.0054C41.7422 54.5033 45.4641 58.1638 50.0397 58.1638C54.6153 58.1638 58.3372 54.5041 58.3372 50.0054C58.3372 45.5066 54.6145 41.8469 50.0397 41.8469C45.4641 41.8469 41.7422 45.5066 41.7422 50.0054ZM63.3248 39.6355C65.0208 39.6355 66.3956 38.2606 66.3956 36.5646C66.3956 34.8687 65.0208 33.4938 63.3248 33.4938C61.6288 33.4938 60.2539 34.8687 60.2539 36.5646C60.2539 38.2606 61.6288 39.6355 63.3248 39.6355Z"
                      fill="#01c5c4"
                    ></path>
                  </svg>
                </a>
              </li>
            </ul>

            <ul className="flex items-center gap-x-3">
              <li className="">
                <a href="#" className="text-white text-xl font-medium">
                  KZ
                </a>
              </li>
              <li className="">
                <a href="#" className="text-white text-xl font-medium">
                  RU
                </a>
              </li>
            </ul>
          </div>

          <button className="md:hidden"></button>
        </div>
      </header> */}

      <main className="px-4 md:px-6 lg:max-w-7xl mx-auto lg:px-10 py-12">
        <h1 className="text-center text-4xl font-bold text-[#232323]">
          <Trans>Номинации</Trans>
        </h1>

        <ul className="flex flex-wrap justify-center max-md:flex-col max-md:items-center gap-x-6 gap-y-4 mt-5">
          {NOMINATIONS_LIST.map((nomination) => (
            <li key={nomination.name}>
              <label className="filter-button">
                <input
                  hidden
                  type="checkbox"
                  className="w-4 h-4 checked:accent-[#02C5C4]"
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      setSelectedNominations((prev) => {
                        return [...prev, nomination.name];
                      });
                    } else {
                      setSelectedNominations((prev) => {
                        return [...prev.filter((i) => i !== nomination.name)];
                      });
                    }
                  }}
                />
                <span className="max-md:text-center  text-[#232323]">
                  <Trans>{nomination.nomination}</Trans>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="flex justify-center mt-4 gap-x-4 text-[#232323]">
          <button
            onClick={switchLanguage("ru")}
            className={`${
              i18n.language === "ru" && "bg-[#02C5C4] text-white"
            } px-4 py-1.5 rounded-md font-semibold text-sm transition duration-200 bg-[#02C5C41c] text-[#02C5C4] active:bg-[#02C5C4] active:text-white shadow-sm hover:bg-[#02c5c533]`}
          >
            <Trans>Русский</Trans>
          </button>
          <button
            onClick={switchLanguage("kz")}
            className={`${
              i18n.language === "kz" && "bg-[#02C5C4] text-white"
            } px-4 py-1.5 rounded-md font-semibold text-sm transition duration-200 bg-[#02C5C41c] text-[#02C5C4] active:bg-[#02C5C4] active:text-white shadow-sm hover:bg-[#02c5c533]`}
          >
            <Trans>Казахский</Trans>
          </button>
        </div>

        <div className="my-8 w-full bg-[#9A9A9A] h-[1px]"></div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {!isLoading
            ? selectedNominations.length
              ? candidates.map((candidate) =>
                  candidate.nominations.map((nomination) => {
                    if (selectedNominations.includes(nomination.nomination)) {
                      return (
                        <li key={nomination.id}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="w-full">
                              <h1 className="text-2xl font-semibold text-[#232323] capitalize">
                                <Trans>{candidate.full_name}</Trans>
                              </h1>

                              <p className="mt-3 font-medium text-sm px-6 py-3 rounded-full w-fit border border-[#02C5C4]">
                                <Trans>
                                  {NOMINATIONS[nomination.nomination]}
                                </Trans>
                              </p>

                              <p
                                onMouseEnter={(e) => {
                                  e.currentTarget.lastElementChild.classList.add(
                                    "block"
                                  );
                                  e.currentTarget.lastElementChild.classList.remove(
                                    "hidden"
                                  );
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.lastElementChild.classList.remove(
                                    "block"
                                  );
                                  e.currentTarget.lastElementChild.classList.add(
                                    "hidden"
                                  );
                                }}
                                className="relative last:block mt-4 font-medium text-[#232323]"
                              >
                                {String(t("candidate.bio")).substring(0, 200)}
                                ...
                                <span className="hidden z-40 overflow-y-auto h-52 absolute top-0 left-0 bg-white p-2 rounded-md shadow-lg">
                                  <Trans>{candidate.bio}</Trans>
                                </span>
                              </p>

                              <div className="mt-4 font-medium text-[#232323]">
                                <span>
                                  <Trans>Проголосовали</Trans>:{" "}
                                </span>
                                <span className="font-bold text-sm py-1.5 px-4 bg-[#02C5C4] text-white rounded-full">
                                  {nomination.votes}
                                </span>
                              </div>

                              <ul className="mt-4 flex flex-wrap gap-3 items-start">
                                {candidate.materials.map((material, index) => (
                                  <li
                                    className="grid grid-cols-1"
                                    key={material.id}
                                  >
                                    <a
                                      className="w-10 h-10 grid place-items-center border rounded-full border-[#9A9A9A] font-medium text-[#232323]"
                                      href={material.link}
                                    >
                                      {index + 1}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="max-md:row-start-1">
                              <img
                                className="rounded-xl"
                                src={candidate.photo}
                                alt=""
                              />
                            </div>

                            <button
                              onClick={handleVote(
                                candidate.id,
                                nomination.nomination
                              )}
                              className="py-4 font-bold text-white rounded-full border border-[#02C5C4] bg-[#02C5C4] sm:col-start-1 sm:col-end-3"
                            >
                              <Trans>Проголосовать</Trans>
                            </button>
                          </div>
                        </li>
                      );
                    }
                  })
                )
              : candidates.map((candidate) =>
                  candidate.nominations.map((nomination) => {
                    return (
                      <li key={nomination.id}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="w-full">
                            <h1 className="text-2xl font-semibold text-[#232323] capitalize">
                              <Trans>{candidate.full_name}</Trans>
                            </h1>

                            <p className="mt-3 font-medium text-sm px-6 py-3 rounded-full w-fit border border-[#02C5C4]">
                              <Trans>
                                {NOMINATIONS[nomination.nomination]}
                              </Trans>
                            </p>

                            <p
                              onMouseEnter={(e) => {
                                e.currentTarget.lastElementChild.classList.add(
                                  "block"
                                );
                                e.currentTarget.lastElementChild.classList.remove(
                                  "hidden"
                                );
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.lastElementChild.classList.remove(
                                  "block"
                                );
                                e.currentTarget.lastElementChild.classList.add(
                                  "hidden"
                                );
                              }}
                              className="relative last:block mt-4 font-medium text-[#232323]"
                            >
                              {String(t(candidate.bio)).substring(0, 200)}...
                              <span className="hidden z-40 overflow-y-auto h-52 absolute top-0 left-0 bg-white p-2 rounded-md shadow-lg">
                                <Trans>{candidate.bio}</Trans>
                              </span>
                            </p>

                            <div className="mt-4 font-medium text-[#232323]">
                              <span>
                                <Trans>Проголосовали</Trans>:{" "}
                              </span>
                              <span className="font-bold text-sm py-1.5 px-4 bg-[#02C5C4] text-white rounded-full">
                                {nomination.votes}
                              </span>
                            </div>

                            <ul className="mt-4 flex flex-wrap gap-3 items-start">
                              {candidate.materials.map((material, index) => (
                                <li
                                  className="grid grid-cols-1"
                                  key={material.id}
                                >
                                  <a
                                    className="w-10 h-10 grid place-items-center border rounded-full border-[#9A9A9A] font-medium text-[#232323]"
                                    href={material.link}
                                  >
                                    {index + 1}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="max-md:row-start-1">
                            <img
                              className="rounded-xl"
                              src={candidate.photo}
                              alt=""
                            />
                          </div>

                          <button
                            onClick={handleVote(
                              candidate.id,
                              nomination.nomination
                            )}
                            className="py-4 font-bold text-white rounded-full border border-[#02C5C4] bg-[#02C5C4] sm:col-start-1 sm:col-end-3 transition duration-200 stroke hover:bg-[#01abab]"
                          >
                            <Trans>Проголосовать</Trans>
                          </button>
                        </div>
                      </li>
                    );
                  })
                )
            : ""}
        </ul>
      </main>

      <LoginModal />
    </div>
  );
}
