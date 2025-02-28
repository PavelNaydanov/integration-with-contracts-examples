# Hardhat проект для проверки подписи по EIP-712

В работе с подписями в Ethereum совершается много ошибок при реализации смарт-контрактов. Особенно это касается стандарта EIP-712. Разработчику смарт-контрактов новичку приходится трудно, необходимо понимать идею блокчейна и азы криптографии.

Более того, хорошими темпами набирает ход набор инструментов для разработки смарт-контрактов Foundry. Он позволяет писать тесты на Solidity, продвинутые инструменты тестирования и так далее. Но ничем не ограничивает реализацию механизма проверки подписи на смарт-контракте. Существует способ создать моковую подпись для проверки работоспособности смарт-контракта, но этот мок можно подогнать под ошибку проверки подписи. Поэтому правильность работы с подписями на смарт-контрактах очень важная тема.

**Цель проекта:** описать варианты наиболее частых случаев в которых допускаются ошибки при проверки подписи на смарт-контрактах. А также подготовить шаблоны тестов на js, которые можно передавать фронтендерам в качестве примеров.

Спецификация стандарта [EIP-712](https://eips.ethereum.org/EIPS/eip-712).

## Старт проекта

- Сборка проекта
```shell
1. npm ci
2. npx hardhat compile
```

- Запуск тестов
```shell
npx hardhat test
```

## Примеры

Примеры будут описывать правильный вариант реализации проверки подписи на смарт-контрактах в наиболее частых случаях ошибок. Каждый смарт-контракт имеет соответствующий файл теста.

Основная идея заключается в том, что пользователь подписывает данные в пользу оператора - это специальный адрес. который вызывает функции на смарт-контракте для того, чтобы выполнить действие для пользователя.

Все примеры смарт-контрактов реализуют две базовые функции: `checkSignature()` и `useSignature()`. Первая функция занимается только проверкой подписи, вторая меняет состояние блокчейна. Работа ведется с похожей структурой данных под названием `Order`. Это произвольная структура, которая может в реальной жизни описывать изменение баланса пользователя, покупку или продажу актива.

### Проверка подписи с использованием EIP-712 смарт-контракта от OpenZeppelin

Будет использоваться, как референс для всех примеров. Исключает проблемы с формированием domain подписи.

```solidity
    // Наследуемся от контракта EIP712, который берем в библиотеке OpenZeppelin
    // Внутри уже реализованы все базовые функции для безопасного кодирования параметров подписи
    constructor() EIP712("EIP-712 based on OZ", "1") {}

    function checkSignature(SigArgs calldata args) public view returns (bool) {
        // Формируем digest при помощи функции _hashTypedDataV4,
        // которую нам дает наследование от EIP712
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            ORDER_TYPE_HASH,
            msg.sender, // operator
            args.token,
            args.amount,
            _nonces[args.user] + 1
        )));

        // При помощи еще одного контракта ECDSA от OpenZeppelin
        // восстанавливаем публичный ключ аккаунта, подписавшего данные
        address signer = ECDSA.recover(digest, args.signature);
        if (signer != args.user) {
            return false;
        }

        return true;
    }
```

По мимо восстановления подписи на смарт-контракте посмотрим на обратную сторону ts кода, который показывает, как формируется подпись на клиенте при помощи библиотеки viem. У нас за работу фронтенда отвечают тесты.

Код ниже показывает формирование подписи на клиенте.
```ts
const signature = await userWallet.signTypedData({
    // Домен согласно спецификации
    domain: {
        name: 'EIP-712 based on OZ',
        version: '1',
        chainId: 31337n,
        verifyingContract: checker.address,
    },
    // Типы передаваемых данных, для того, чтобы под капотом значения закодировались в правильные solidity типы
    types: {
        Order : [
            {name: 'operator', type: 'address'},
            {name: 'token', type: 'address'},
            {name: 'amount', type: 'uint256'},
            {name: 'nonce', type: 'uint256'},
        ]
    },
    // Структура данных подписи с которой начнется кодирование
    primaryType: 'Order',
    // Данные для кодирования согласно описанным типам
    message: {
        operator: operatorWallet.account.address,
        token: token.address,
        amount: amount,
        nonce: lastNonce + BigInt(1)
    }
});
```

_Важно!_ PrimaryType не описывается практически нигде, но компилятор тайпскрипта будет ругаться, если это поле не указано. Необходимо оно только на клиенте при кодировании полей, так как данные подписи могут быть вложенными друг в друга, алгоритму кодирования нужно явно указывать с какого типа (структуры) начинать кодирование.

- Смарт-контракт - [CheckerWithOZ.sol](./contracts/CheckerWithOZ.sol)
- Тест - [CheckerWithOZ.test.ts](./test/CheckerWithOZ.test.ts)

### Проверка динамических типов bytes и string

Очень часто не правильно описывается переменные динамического типа bytes и string для digest, которые принимают участие в подписи. Нужно помнить, что переменные типа string и bytes должны быть обернуты в `keccak256`.

```solidity
bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
    ORDER_TYPE_HASH,
    msg.sender, // operator
    args.token,
    args.amount,
    _nonces[args.user] + 1,
    // args.data и args.str - некорректный вариант использования.
    // Для динамических типов нужно использовать хеш
    // А строку надо еще кодировать abi.encodePacked
    keccak256(args.data),
    keccak256(abi.encodePacked(args.str))
)));
```

- Смарт-контракт [DynamicTypeChecker.sol](./contracts/DynamicTypeChecker.sol)
- Тест [DynamicTypeChecker.test.ts](./test/DynamicTypeChecker.test.ts)

### Проверка вложенных структур

Зачастую неочевидно каким образом для вложенных структур описывать TYPE_HASH и как кодировать digest.

```solidity
// Обратите внимание, как описываются вложенные структуры, для каждой есть свой TYPE_HASH
bytes32 private constant OPERATOR_TYPE_HASH =
    keccak256("Operator(address operator,string name)");
bytes32 private constant ORDER_TYPE_HASH =
    keccak256("Order(Operator operator,address token,uint256 amount,uint256 nonce)Operator(address operator,string name)"); // Вот такую структуру будем кодировать. В нее вложена структура Operator

function checkSignature(SigArgs calldata args) public view returns (bool) {
    bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
        ORDER_TYPE_HASH,
        keccak256(abi.encode( // Кодируем отдельно все поля вложенной структуры Operator
            OPERATOR_TYPE_HASH, // Не забываем про TYPE_HASH для структуры оператор
            msg.sender, // Operator
            keccak256(abi.encodePacked(args.operatorName)) // Не забываем про динамические типы, если они есть
        )),
        args.token,
        args.amount,
        _nonces[args.user] + 1
    )));

    ...
}
```

- Смарт-контракт - [NestedStructChecker.sol](./contracts/NestedStructChecker.sol)
- Тест - [NestedStructChecker.test.ts](./test/NestedStructChecker.test.ts)

### Проверка массивов

Часто разработчики не правильно кодируют массивы данных, которые являются частью подписи. Поэтому нужно обращать внимание, что массивы правильно указываются в TYPE_HASH, а сами значения кодируются и хешируются.

```solidity
// Указываем, что из полей массивы
bytes32 private constant ORDER_TYPE_HASH =
    keccak256("Order(address operator,address[] tokens,uint256[] amounts,uint256 nonce)");

function checkSignature(SigArgs calldata args) public view returns (bool) {
    bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
        ORDER_TYPE_HASH,
        msg.sender, // operator
        keccak256(abi.encodePacked(args.tokens)), // Массив оборачивается в abi.encodePacked и keccak256
        keccak256(abi.encodePacked(args.amounts)), // Массив оборачивается в abi.encodePacked и keccak256
        _nonces[args.user] + 1
    )));

    address signer = ECDSA.recover(digest, args.signature);
    if (signer != args.user) {
        return false;
    }

    return true;
}
```

- Смарт-контракт [ArrayChecker.sol](./contracts/ArrayChecker.sol)
- Тест - [ArrayChecker.test.ts](./test/ArrayChecker.test.ts)