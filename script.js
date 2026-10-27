
"use strict";

const $ = (id) => document.getElementById(id);

const expenseList = $("expenseList");
const addExpenseBtn = $("addExpenseBtn");
const calculateBtn = $("calculateBtn");
const copyBtn = $("copyBtn");
const printBtn = $("printBtn");
const resetBtn = $("resetBtn");

const denominationInputs = document.querySelectorAll(".denomination");

const money = (amount) =>
    "Rs. " + Number(amount || 0).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

const numberValue = (id) => {
    const value = Number($(id).value);
    return Number.isFinite(value) ? value : 0;
};

const safeText = (value) => String(value ?? "").trim();

function addExpense(description = "", amount = "") {
    const row = document.createElement("div");
    row.className = "expense-row";

    const descriptionField = document.createElement("div");
    descriptionField.className = "expense-description";

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "Expense Description";

    const descriptionInput = document.createElement("input");
    descriptionInput.type = "text";
    descriptionInput.className = "expense-name";
    descriptionInput.placeholder = "e.g. Tea, transport, shop supplies";
    descriptionInput.value = description;

    descriptionField.append(descriptionLabel, descriptionInput);

    const amountField = document.createElement("div");
    amountField.className = "expense-amount";

    const amountLabel = document.createElement("label");
    amountLabel.textContent = "Amount (Rs.)";

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.className = "expense-value";
    amountInput.min = "0";
    amountInput.step = "0.01";
    amountInput.placeholder = "0";
    amountInput.value = amount;

    amountField.append(amountLabel, amountInput);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-expense";
    removeButton.textContent = "×";
    removeButton.title = "Remove expense";
    removeButton.setAttribute("aria-label", "Remove expense");

    removeButton.addEventListener("click", () => {
        row.remove();
        calculateTally();
    });

    descriptionInput.addEventListener("input", calculateTally);
    amountInput.addEventListener("input", calculateTally);

    row.append(descriptionField, amountField, removeButton);
    expenseList.appendChild(row);

    calculateTally();
}

function getExpenses() {
    return Array.from(expenseList.querySelectorAll(".expense-row")).map((row) => {
        const description = safeText(row.querySelector(".expense-name").value);
        const rawAmount = row.querySelector(".expense-value").value;
        const amount = Math.max(0, Number(rawAmount) || 0);

        return { description, amount };
    });
}

function getTotalExpenses() {
    return getExpenses().reduce((sum, expense) => sum + expense.amount, 0);
}

function getPhysicalCash() {
    let total = 0;

    denominationInputs.forEach((input) => {
        const count = Math.max(0, Math.floor(Number(input.value) || 0));
        const denomination = Number(input.dataset.value);

        total += count * denomination;

        const output = $("total" + denomination);
        if (output) {
            output.textContent = money(count * denomination);
        }
    });

    total += Math.max(0, numberValue("otherCash"));

    return total;
}

function getDifferenceStatus(difference) {
    if (Math.abs(difference) < 0.005) {
        return {
            label: "Cash Matched",
            className: "matched"
        };
    }

    if (difference > 0) {
        return {
            label: "Extra Cash",
            className: "positive"
        };
    }

    return {
        label: "Cash Short",
        className: "negative"
    };
}

function getReportData() {
    const date = $("businessDate").value;
    const openingCash = Math.max(0, numberValue("openingCash"));
    const totalBilling = Math.max(0, numberValue("totalBilling"));
    const jazzCash = Math.max(0, numberValue("jazzCash"));
    const expenses = getExpenses();
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const actualCash = getPhysicalCash();

    // Cash sales assumes all billing other than JazzCash was paid in cash.
    const cashSales = totalBilling - jazzCash;

    // Expected physical cash = opening cash + cash sales - expenses.
    const expectedCash = openingCash + cashSales - totalExpenses;
    const difference = actualCash - expectedCash;
    const status = getDifferenceStatus(difference);

    return {
        date,
        openingCash,
        totalBilling,
        jazzCash,
        cashSales,
        expenses,
        totalExpenses,
        actualCash,
        expectedCash,
        difference,
        status
    };
}

function createCalculationText(data) {
    const expenseLines = data.expenses.length
        ? data.expenses.map((expense, index) => {
            const description = expense.description || "Expense " + (index + 1);
            return `${index + 1}. ${description}: ${money(expense.amount)}`;
        }).join("\n")
        : "No expenses entered.";

    return [
        `Business Date: ${data.date || "Not selected"}`,
        "",
        "EXPENSE BREAKDOWN",
        expenseLines,
        `Total Expenses: ${money(data.totalExpenses)}`,
        "",
        "CASH SALES",
        `Total Billing: ${money(data.totalBilling)}`,
        `Less JazzCash: ${money(data.jazzCash)}`,
        `Cash Sales: ${money(data.cashSales)}`,
        "",
        "EXPECTED CLOSING CASH",
        `Opening Drawer Cash: ${money(data.openingCash)}`,
        `Add Cash Sales: ${money(data.cashSales)}`,
        `Less Expenses: ${money(data.totalExpenses)}`,
        `Expected Closing Cash: ${money(data.expectedCash)}`,
        "",
        "FINAL TALLY",
        `Actual Physical Closing Cash: ${money(data.actualCash)}`,
        `Expected Closing Cash: ${money(data.expectedCash)}`,
        `Difference: ${money(data.difference)}`,
        `Status: ${data.status.label}`
    ].join("\n");
}

function createDailyReport(data) {
    const expenseLines = data.expenses.length
        ? data.expenses.map((expense, index) => {
            const description = expense.description || "Expense " + (index + 1);
            return `${index + 1}. ${description} — ${money(expense.amount)}`;
        }).join("\n")
        : "No expenses";

    const differenceDescription = data.difference > 0
        ? "Extra cash"
        : data.difference < 0
            ? "Cash short"
            : "Matched";

    return [
        "DAILY CASH TALLY REPORT",
        "================================",
        `Date: ${data.date || "Not selected"}`,
        "",
        `Opening Drawer Cash: ${money(data.openingCash)}`,
        `Total Billing: ${money(data.totalBilling)}`,
        `JazzCash Received: ${money(data.jazzCash)}`,
        `Cash Sales: ${money(data.cashSales)}`,
        "",
        "EXPENSES",
        expenseLines,
        `Total Expenses: ${money(data.totalExpenses)}`,
        "",
        `Expected Closing Cash: ${money(data.expectedCash)}`,
        `Actual Closing Cash: ${money(data.actualCash)}`,
        `Difference: ${money(Math.abs(data.difference))} (${differenceDescription})`,
        `Final Status: ${data.status.label}`,
        "================================",
        "Calculation: Opening Cash + Billing - JazzCash - Expenses",
        "Difference: Actual Closing Cash - Expected Closing Cash"
    ].join("\n");
}

function calculateTally() {
    const data = getReportData();

    $("totalExpenses").textContent = money(data.totalExpenses);
    $("actualCash").textContent = money(data.actualCash);
    $("actualCashResult").textContent = money(data.actualCash);
    $("cashSales").textContent = money(data.cashSales);
    $("expectedCash").textContent = money(data.expectedCash);
    $("cashDifference").textContent =
        (data.difference > 0 ? "+" : data.difference < 0 ? "−" : "") +
        money(Math.abs(data.difference));

    $("differenceStatus").textContent = data.status.label;

    const differenceCard = $("cashDifference").closest(".result-card");
    differenceCard.classList.remove("positive", "negative", "matched");
    differenceCard.classList.add(data.status.className);

    $("calculationDetails").textContent = createCalculationText(data);
    $("dailyReport").textContent = createDailyReport(data);
}

function clearForm() {
    const confirmed = window.confirm(
        "Clear all daily figures and expenses? This cannot be undone."
    );

    if (!confirmed) return;

    $("openingCash").value = "";
    $("totalBilling").value = "";
    $("jazzCash").value = "";
    $("otherCash").value = "0";

    denominationInputs.forEach((input) => {
        input.value = "0";
    });

    expenseList.innerHTML = "";
    addExpense();

    calculateTally();
}

async function copyReport() {
    calculateTally();

    const report = $("dailyReport").textContent;

    try {
        await navigator.clipboard.writeText(report);
        copyBtn.textContent = "Copied!";
        window.setTimeout(() => {
            copyBtn.textContent = "Copy Report";
        }, 1800);
    } catch (error) {
        const temporary = document.createElement("textarea");
        temporary.value = report;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand("copy");
        temporary.remove();

        if (copied) {
            copyBtn.textContent = "Copied!";
            window.setTimeout(() => {
                copyBtn.textContent = "Copy Report";
            }, 1800);
        } else {
            window.alert("Copy failed. Please select and copy the report manually.");
        }
    }
}

function printReport() {
    calculateTally();
    window.print();
}

function setToday() {
    const today = new Date();
    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);

    $("businessDate").value = localDate;
}

addExpenseBtn.addEventListener("click", () => addExpense());
calculateBtn.addEventListener("click", calculateTally);
copyBtn.addEventListener("click", copyReport);
printBtn.addEventListener("click", printReport);
resetBtn.addEventListener("click", clearForm);

[
    "businessDate",
    "openingCash",
    "totalBilling",
    "jazzCash",
    "otherCash"
].forEach((id) => {
    $(id).addEventListener("input", calculateTally);
    $(id).addEventListener("change", calculateTally);
});

denominationInputs.forEach((input) => {
    input.addEventListener("input", calculateTally);
    input.addEventListener("change", calculateTally);
});

setToday();
addExpense();
calculateTally();
