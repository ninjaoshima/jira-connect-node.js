const router = require('express').Router({ mergeParams: true });

const JiraClient = require("jira-connector");
const jira = new JiraClient({
    host: process.env.JIRA_HOST,
    basic_auth: {
        email: process.env.USER_EMAIL,
        api_token: process.env.API_TOKEN
    }
});

const PROJECT_KEY = process.env.PROJECT_KEY || "CLOUD"

const getProject = async (id) => {
    let project = await jira.project.getProject({projectIdOrKey: id});
    return project
}

const getAllIssues = async (id) => {
    let issues = await jira.search.search({jql: "project="+id, fields:["issuetype", "key", "summary", "reporter", "assignee", "status", "created"]})
    return issues;
}

const getIssue = async (id) => {
    return await jira.issue.getIssue({issueKey:id});
}

const getComments = async(issueKey) => {
    return await jira.issue.getComments({issueKey})
}


router.get("/", async (req, res) => {
    return res.redirect('/project/' + PROJECT_KEY);
});

router.get("/project/:projectKey", async (req, res) => {
    let project = await getProject(req.params.projectKey)
    let snapshot = await getAllIssues(req.params.projectKey)
    return res.render("issues", {title:"Issues List", project, issues: snapshot.issues})
});

router.get("/comments/:issueKey", async (req, res) => {
    let comments = await getComments(req.params.issueKey)
    let issue = await getIssue(req.params.issueKey)
    return res.render("comments", {title:"Ticket List", issue, comments: comments.comments})
});

router.post('/project/filter', async (req, res) => {
    let reporter = req.body.reporter
    let snapshot = await getAllIssues(PROJECT_KEY)
    if (reporter == "")
        return res.json({issues: snapshot.issues})
    issues = snapshot.issues.filter(item => item.fields.reporter.displayName.includes(reporter))

    return res.json({issues})
})

router.get('/api/projects', async(req, res) => {
    res.setHeader("Set-Cookie", "Secure;SameSite=None")
    return res.json({status:1})
})

module.exports = router;