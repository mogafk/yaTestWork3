##Тестовое задание 2

__

~~сделано~~

1. ~~умеет открывать аудиофайлы (поддерживаемых браузером форматов) с локального диска;~~
2. ~~поддерживает drag'n'drop;~~
3. ~~имеет кнопки play и stop;~~
4. ~~выводит название проигрываемого файла;~~
	* если может прочитать metadata, то вместо названия файла название песни
5. ~~умеет отображать хотя бы один вариант визуализации (waveform или spectrum);~~
6. работает в Яндекс.Браузере, Safari, Chrome, Firefox.
	* не было возможности протестить в safari

Дополнительно реализуйте возможность:

1. выбора настройки эквалайзера (pop, rock, jazz, classic, normal);
	* вобще не затронул
2. вывод названия песни и исполнителя из метаданных аудиофайла.
	* для считывания metadata использовалась постороняя библиотека. Читаются только mp3 файлы, если пользователь загружает не mp3, то его уведомляют, что metadata нельзя прочитать. Читаются как id3v1 так и id3v2. Использовал чужую чтобы избежать сложностей id3v2
